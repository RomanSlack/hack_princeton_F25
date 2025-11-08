from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Union, Dict, Any
from enum import Enum
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
import logging
import asyncio
import os
from game_client import GameEnvironmentClient
from openai import OpenAI
from abc import ABC, abstractmethod

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
DEFAULT_STEP_DELAY = float(os.getenv("STEP_DELAY", "6.0"))
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "5.0"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DAEDALUS_API_KEY = os.getenv("DEDALUS_API_KEY")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "daedalus").lower()

# Initialize OpenAI client for chat functionality
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    logger.warning("OPENAI_API_KEY not found in environment variables. Chat functionality will be disabled.")

# Configuration for action history
MAX_ACTION_HISTORY = 5  # Maximum number of past actions to include in context


# ============================================================================
# LLM Provider Abstraction Layer
# ============================================================================

class LLMResponse(BaseModel):
    """Standardized response from LLM providers"""
    final_output: str

    class Config:
        extra = "allow"


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    @abstractmethod
    async def run(
        self,
        input: str,
        model: str,
        mcp_servers: Optional[List[str]] = None,
        timeout: float = LLM_TIMEOUT
    ) -> LLMResponse:
        """Execute LLM inference with given input and return response"""
        pass


class DaedalusProvider(LLMProvider):
    """Daedalus Labs provider - supports MCP servers and multiple model providers"""

    def __init__(self):
        if not DAEDALUS_API_KEY:
            raise ValueError("DEDALUS_API_KEY not found in environment variables")
        self.client = AsyncDedalus()
        self.runner = DedalusRunner(self.client)
        logger.info("✓ Daedalus provider initialized (MCP support enabled)")

    async def run(
        self,
        input: str,
        model: str,
        mcp_servers: Optional[List[str]] = None,
        timeout: float = LLM_TIMEOUT
    ) -> LLMResponse:
        """Run inference through Daedalus with optional MCP servers"""
        try:
            if mcp_servers:
                logger.info(f"Calling Daedalus with model: {model}, MCP servers: {mcp_servers}")
                response = await asyncio.wait_for(
                    self.runner.run(
                        input=input,
                        model=model,
                        mcp_servers=mcp_servers,
                    ),
                    timeout=timeout
                )
            else:
                logger.info(f"Calling Daedalus with model: {model}")
                response = await asyncio.wait_for(
                    self.runner.run(
                        input=input,
                        model=model,
                    ),
                    timeout=timeout
                )
            return LLMResponse(final_output=response.final_output)
        except asyncio.TimeoutError:
            logger.error(f"⏱️ Daedalus LLM timeout after {timeout}s")
            raise HTTPException(
                status_code=408,
                detail=f"LLM request timed out after {timeout} seconds"
            )


class OpenAIProvider(LLMProvider):
    """Direct OpenAI API provider - faster, simpler, but no MCP support"""

    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("✓ OpenAI direct API provider initialized (no MCP support)")

    def _normalize_model_name(self, model: str) -> str:
        """Convert Daedalus-style model names to OpenAI model names"""
        # Remove provider prefix if present (e.g., "openai/gpt-4o-mini" -> "gpt-4o-mini")
        if "/" in model:
            provider, model_name = model.split("/", 1)
            if provider.lower() != "openai":
                logger.warning(f"Non-OpenAI model '{model}' requested with OpenAI provider. Using gpt-4o-mini instead.")
                return "gpt-4o-mini"
            return model_name
        return model

    async def run(
        self,
        input: str,
        model: str,
        mcp_servers: Optional[List[str]] = None,
        timeout: float = LLM_TIMEOUT
    ) -> LLMResponse:
        """Run inference through OpenAI API directly"""
        if mcp_servers:
            logger.warning(f"MCP servers {mcp_servers} requested but not supported with OpenAI provider. Ignoring.")

        normalized_model = self._normalize_model_name(model)
        logger.info(f"Calling OpenAI API with model: {normalized_model}")

        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self.client.chat.completions.create(
                        model=normalized_model,
                        messages=[
                            {"role": "user", "content": input}
                        ],
                        temperature=0.7,
                        max_tokens=500
                    )
                ),
                timeout=timeout
            )

            final_output = response.choices[0].message.content
            return LLMResponse(final_output=final_output)

        except asyncio.TimeoutError:
            logger.error(f"⏱️ OpenAI API timeout after {timeout}s")
            raise HTTPException(
                status_code=408,
                detail=f"LLM request timed out after {timeout} seconds"
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(e)}"
            )


def create_llm_provider() -> LLMProvider:
    """Factory function to create the appropriate LLM provider based on configuration"""
    if LLM_PROVIDER == "openai":
        return OpenAIProvider()
    elif LLM_PROVIDER == "daedalus":
        return DaedalusProvider()
    else:
        logger.warning(f"Unknown LLM_PROVIDER '{LLM_PROVIDER}', defaulting to daedalus")
        return DaedalusProvider()


# ============================================================================
# Pydantic Models for Block Types
# ============================================================================

class ToolConnection(BaseModel):
    """Connection from an Agent block to a Tool block"""
    tool_id: str = Field(..., description="ID of the tool block to connect to")
    tool_name: Literal["move", "attack", "collect", "plan", "search"] = Field(
        ..., description="Name of the tool (must match the tool block's tool_type)"
    )


class ActionBlock(BaseModel):
    """Action block - entry points like onStart, onAttacked"""
    id: str = Field(..., description="Unique identifier for this block")
    type: Literal["action"] = "action"
    action_type: Literal["onStart", "onAttacked"] = Field(
        ..., description="Type of action that triggers this entry point"
    )
    next: Optional[str] = Field(
        None, description="ID of the next block to execute"
    )


class AgentBlock(BaseModel):
    """Agent block - calls LLM to decide which tool to use"""
    id: str = Field(..., description="Unique identifier for this block")
    type: Literal["agent"] = "agent"
    model: str = Field(..., description="LLM model to use (e.g., openai/gpt-5)")
    system_prompt: str = Field(..., description="System prompt for the LLM")
    user_prompt: str = Field(..., description="User prompt for the LLM")
    tool_connections: List[ToolConnection] = Field(
        ..., description="List of tools this agent can choose from"
    )

    @validator("tool_connections")
    def validate_tool_connections(cls, v):
        if len(v) == 0:
            raise ValueError("Agent block must have at least one tool connection")
        return v


class ToolBlock(BaseModel):
    """Tool block - executes a game action"""
    id: str = Field(..., description="Unique identifier for this block")
    type: Literal["tool"] = "tool"
    tool_type: Literal["move", "attack", "collect", "plan", "search"] = Field(
        ..., description="Type of tool action"
    )
    parameters: Dict[str, str] = Field(
        default_factory=dict,
        description="Parameter schema for this tool. Key is parameter name, value is type description (e.g., {'x': 'number', 'y': 'number'})"
    )
    next: Optional[str] = Field(
        None, description="ID of the next block to execute (can be null)"
    )


# Discriminated union for all block types
Block = Union[ActionBlock, AgentBlock, ToolBlock]


class ProgramSchema(BaseModel):
    """Schema for the Scratch-like program sent by the client"""
    agent_id: str = Field(..., description="Unique identifier for this agent (provided by client)")
    blocks: List[Block] = Field(..., description="List of all blocks in the program")

    @validator("blocks")
    def validate_blocks(cls, v):
        if len(v) == 0:
            raise ValueError("Program must have at least one block")

        # Check for at least one onStart action
        has_on_start = any(
            isinstance(block, ActionBlock) and block.action_type == "onStart"
            for block in v
        )
        if not has_on_start:
            raise ValueError("Program must have at least one 'onStart' action block")

        # Validate all block IDs are unique
        block_ids = [block.id for block in v]
        if len(block_ids) != len(set(block_ids)):
            raise ValueError("All block IDs must be unique")

        # Validate all referenced IDs exist
        block_id_set = set(block_ids)
        for block in v:
            if isinstance(block, (ActionBlock, ToolBlock)) and block.next:
                if block.next not in block_id_set:
                    raise ValueError(f"Block {block.id} references non-existent block: {block.next}")
            elif isinstance(block, AgentBlock):
                for conn in block.tool_connections:
                    if conn.tool_id not in block_id_set:
                        raise ValueError(
                            f"Agent block {block.id} references non-existent tool block: {conn.tool_id}"
                        )

        return v


class AgentState(BaseModel):
    """Runtime state for an agent"""
    agent_id: str
    program: ProgramSchema
    current_node: Optional[str] = None
    current_plan: Optional[str] = None
    last_agent_block: Optional[str] = None  # Track the last agent block executed for looping
    last_executed_tool_block: Optional[str] = None  # Track the last tool block executed for animation
    past_actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="History of past actions taken by the agent (limited to MAX_ACTION_HISTORY)"
    )


class GameState(BaseModel):
    """
    Flexible game state model.
    Since we don't know the exact structure yet, we'll keep this flexible.
    """
    # Allow any additional fields
    class Config:
        extra = "allow"

    # Example fields (these are placeholders and will be updated later)
    agent_id: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    health: Optional[float] = None
    nearby_agents: Optional[List[Dict[str, Any]]] = None
    inventory: Optional[List[str]] = None


class NextStepRequest(BaseModel):
    """Request model for next-step-for-agents endpoint"""
    agent_id: str = Field(..., description="The agent to execute the next step for")
    game_state: GameState = Field(..., description="Current game state for the agent")
    action_occurred: Optional[Literal["attacked"]] = Field(
        None, description="Optional action that occurred to trigger special behavior"
    )


class ToolAction(BaseModel):
    """Response model for a tool action"""
    tool_type: Literal["move", "attack", "collect", "plan", "search"]
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters for the tool (e.g., direction for move, target for attack)"
    )


class NextStepResponse(BaseModel):
    """Response model for next-step-for-agents endpoint"""
    agent_id: str
    action: Optional[ToolAction] = Field(
        None, description="The action to take, or None if no current block"
    )
    current_node: Optional[str] = Field(
        None, description="The current node after this step"
    )


# Initialize FastAPI app
app = FastAPI(
    title="MMO Agents Backend",
    description="Backend for MMO game with agent-controlled players using drag-and-drop block programming",
    version="0.1.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory game state
agents: Dict[str, AgentState] = {}

# Game session state
class GameSession:
    """Tracks active game session"""
    def __init__(self):
        self.active = False
        self.registered_agents: Dict[str, bool] = {}  # agent_id -> registered in game
        self.step_count = 0
        self.auto_stepping = False
        self.step_delay = DEFAULT_STEP_DELAY  # seconds between auto steps (from .env)

game_session = GameSession()

# Initialize LLM provider based on configuration
try:
    llm_provider = create_llm_provider()
    logger.info(f"🚀 Using LLM provider: {LLM_PROVIDER}")
except Exception as e:
    logger.error(f"Failed to initialize LLM provider: {e}")
    raise

# Initialize game environment client
game_client = GameEnvironmentClient()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await game_client.close()


# Helper Functions

def game_state_to_llm_format(game_state: GameState) -> str:
    """
    Convert game state to LLM-readable format.
    This is a dummy implementation for now since we don't know the exact structure yet.
    """
    # Dummy conversion - just convert to a readable string format
    parts = []

    if game_state.position:
        parts.append(f"Position: x={game_state.position.get('x', 0)}, y={game_state.position.get('y', 0)}")

    if game_state.health is not None:
        parts.append(f"Health: {game_state.health}")

    if game_state.inventory:
        parts.append(f"Inventory: {', '.join(game_state.inventory)}")

    if game_state.nearby_agents:
        parts.append(f"Nearby agents: {', '.join([agent['id'] for agent in game_state.nearby_agents])}")

    if not parts:
        return "No specific game state information available."

    return " | ".join(parts)


async def execute_agent_block(
    agent_block: AgentBlock,
    game_state: GameState,
    all_blocks: List[Block],
    current_plan: Optional[str] = None,
    past_actions: Optional[List[Dict[str, Any]]] = None
) -> tuple[str, Dict[str, Any], str]:
    """
    Execute an agent block using Dedalus SDK to decide which tool to use.
    Returns a tuple of (tool_name, parameters, reasoning).
    """
    logger.info(f"Executing agent block: {agent_block.id}")

    # Convert game state to LLM-readable format
    game_state_str = game_state_to_llm_format(game_state)
    logger.info(f"Game state: {game_state_str}")

    # Add current plan to context if available
    if current_plan:
        logger.info(f"Current plan: {current_plan}")
        game_state_str += f"\n\nCurrent strategic plan: {current_plan}"

    # Add past actions to context if available
    past_actions_str = ""
    if past_actions and len(past_actions) > 0:
        past_actions_str = "\n\nYour recent action history (most recent last):\n"
        for i, action_record in enumerate(past_actions[-MAX_ACTION_HISTORY:], 1):
            action_name = action_record.get('action', 'unknown')
            params = action_record.get('parameters', {})
            reasoning = action_record.get('reasoning', '')

            if params:
                param_str = ", ".join([f"{k}={v}" for k, v in params.items()])
                action_str = f"{action_name}({param_str})"
            else:
                action_str = f"{action_name}()"

            if reasoning:
                past_actions_str += f"{i}. {action_str} - Reasoning: \"{reasoning}\"\n"
            else:
                past_actions_str += f"{i}. {action_str}\n"
        logger.info(f"Including {len(past_actions)} past actions in context")

    # Build a map of tool blocks and their parameter schemas
    tool_blocks_map = {}
    for block in all_blocks:
        if isinstance(block, ToolBlock):
            tool_blocks_map[block.id] = block

    # Get available tools with their parameter schemas
    available_tools_info = []
    for conn in agent_block.tool_connections:
        tool_block = tool_blocks_map.get(conn.tool_id)
        if tool_block:
            if tool_block.parameters:
                param_desc = ", ".join([f"{k}: {v}" for k, v in tool_block.parameters.items()])
                available_tools_info.append(f"{conn.tool_name} (parameters: {param_desc})")
            else:
                available_tools_info.append(f"{conn.tool_name} (no parameters)")

    available_tools = [conn.tool_name for conn in agent_block.tool_connections]
    logger.info(f"Available tools: {', '.join(available_tools)}")

    # Check if MCP tools are available (plan or search)
    has_plan_tool = "plan" in available_tools
    has_search_tool = "search" in available_tools
    has_mcp_tools = has_plan_tool or has_search_tool

    # Build attack-specific context if attack tool is available
    attack_context = ""
    if "attack" in available_tools:
        nearby_agents = game_state.nearby_agents if hasattr(game_state, 'nearby_agents') and game_state.nearby_agents else []
        if nearby_agents:
            attack_context = "\nNEARBY AGENTS YOU CAN ATTACK:\n"
            for agent in nearby_agents[:5]:  # Show top 5 nearest
                attack_context += f"- {agent.get('id')} at distance {agent.get('distance', 0):.1f} (health: {agent.get('health', 0)})\n"
            attack_context += "\nTo attack, use their ID as target_player_id. Your weapon will auto-aim and shoot.\n"
        else:
            attack_context = "\nNo nearby agents to attack.\n"

    # Construct the input prompt
    user_input = (
        f"{agent_block.user_prompt}\n\n"
        f"Current game state: {game_state_str}\n"
        f"{past_actions_str}\n"
        f"Available actions:\n" + "\n".join(f"- {info}" for info in available_tools_info) + "\n"
        f"{attack_context}\n"
        f"IMPORTANT RULES:\n"
        f"MOVEMENT:\n"
        f"- The move tool uses RELATIVE coordinates (how much to move, not where to move to)\n"
        f"- The map bounds are x: 8-504, y: 8-504 (Zone 1 main arena)\n"
        f"- Keep movements SMALL and gradual (recommended: -20 to +20 per move)\n"
        f"- Y-axis: NEGATIVE y moves UP (toward y=8), POSITIVE y moves DOWN (toward y=504)\n"
        f"- X-axis: NEGATIVE x moves LEFT (toward x=8), POSITIVE x moves RIGHT (toward x=504)\n"
        f"ATTACK:\n"
        f"- Attack tool will auto-aim at the target and shoot your equipped weapon\n"
        f"- Attacking happens BEFORE movement in the game tick\n"
        f"- Choose a target from the nearby agents list above\n\n"
        f"Respond with nothing but a JSON object containing 'reasoning' (a brief 1-sentence explanation), 'action' (the action name), and 'parameters' (an object with the required parameters).\n"
        f"Examples:\n"
        f"- Move: {{\"reasoning\": \"Moving toward center\", \"action\": \"move\", \"parameters\": {{\"x\": 5, \"y\": -10}}}}\n"
        f"- Attack: {{\"reasoning\": \"Attacking nearest enemy\", \"action\": \"attack\", \"parameters\": {{\"target_player_id\": \"player_2\"}}}}"
    )

    full_input = agent_block.system_prompt + "\n\n" + user_input
    logger.info(f"LLM Input:\n{full_input}")

    # Build MCP servers list based on available tools
    mcp_servers = []
    if has_plan_tool:
        mcp_servers.append("raptors65/hack-princeton-mcp")
    if has_search_tool:
        mcp_servers.append("tsion/brave-search-mcp")

    # Call LLM provider with MCP server access if MCP tools are available
    logger.info(f"Calling LLM with model: {agent_block.model} (timeout: {LLM_TIMEOUT}s)")
    if mcp_servers:
        logger.info(f"MCP tools detected, including MCP servers: {mcp_servers}")

    # Use the configured LLM provider (Daedalus or OpenAI)
    response = await llm_provider.run(
        input=full_input,
        model=agent_block.model,
        mcp_servers=mcp_servers if mcp_servers else None,
        timeout=LLM_TIMEOUT
    )

    # Extract the tool name and parameters from the response
    logger.info(f"LLM Raw Output: {response.final_output}")

    # Try to parse JSON response
    import json
    import re

    try:
        # Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
        response_text = response.final_output.strip()

        # Remove markdown code block markers
        if response_text.startswith("```"):
            # Extract content between ``` markers
            match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', response_text, re.DOTALL)
            if match:
                response_text = match.group(1).strip()

        response_json = json.loads(response_text)
        reasoning = response_json.get("reasoning", "No reasoning provided")
        tool_choice = response_json.get("action", "").lower()
        parameters = response_json.get("parameters", {})

        # Clamp movement parameters to prevent huge jumps
        if tool_choice == "move" and parameters:
            max_move = 25  # Maximum move distance per step
            if "x" in parameters:
                original_x = parameters["x"]
                parameters["x"] = max(-max_move, min(max_move, parameters["x"]))
                if abs(original_x) > max_move:
                    logger.warning(f"Clamped x movement from {original_x} to {parameters['x']}")
            if "y" in parameters:
                original_y = parameters["y"]
                parameters["y"] = max(-max_move, min(max_move, parameters["y"]))
                if abs(original_y) > max_move:
                    logger.warning(f"Clamped y movement from {original_y} to {parameters['y']}")

        # Log the reasoning
        logger.info(f"🤔 Agent Reasoning: {reasoning}")
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON response: {e}, attempting fallback parsing")
        # Fallback: try to extract just the tool name
        reasoning = "Failed to parse response"
        tool_choice = response.final_output.strip().lower()
        parameters = {}

    # Validate that the chosen tool is in the available tools
    if tool_choice not in available_tools:
        logger.warning(f"LLM chose invalid tool '{tool_choice}', defaulting to '{available_tools[0]}'")
        # Default to the first available tool if the response is invalid
        tool_choice = available_tools[0]
        parameters = {}

    logger.info(f"✅ Selected tool: {tool_choice} with parameters: {parameters}")

    return tool_choice, parameters, reasoning


# Endpoints

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "agents-backend",
        "agents_count": len(agents)
    }


@app.post("/add-agent")
async def add_agent(
    program: ProgramSchema,
    register_in_game: bool = False,
    username: Optional[str] = None,
    preferred_zone: Optional[str] = None
):
    """
    Add a new agent to the backend with its Scratch-like program.

    The agent will start executing from the 'onStart' action block.

    Args:
        program: Agent program with blocks
        register_in_game: If True, also register the agent in the game environment
        username: Optional display name for the agent in the game
        preferred_zone: Optional zone preference ("zone1" or "zone2"). Defaults to zone1 if not specified.
    """
    agent_id = program.agent_id

    # Check if agent already exists
    if agent_id in agents:
        raise HTTPException(
            status_code=400,
            detail=f"Agent with ID '{agent_id}' already exists"
        )

    # Find the onStart action block
    on_start_block = None
    for block in program.blocks:
        if isinstance(block, ActionBlock) and block.action_type == "onStart":
            on_start_block = block
            break

    if not on_start_block:
        raise HTTPException(
            status_code=400,
            detail="Program must contain an 'onStart' action block"
        )

    # Initialize agent state with current_node set to onStart's next block
    agent_state = AgentState(
        agent_id=agent_id,
        program=program,
        current_node=on_start_block.next
    )

    # Add agent to backend state
    agents[agent_id] = agent_state

    # Register in game environment if requested
    game_registration = None
    if register_in_game:
        try:
            game_registration = await game_client.register_agent(agent_id, username, preferred_zone)
            game_session.registered_agents[agent_id] = True
            zone_info = f" in {preferred_zone}" if preferred_zone else ""
            logger.info(f"Agent {agent_id} registered in game environment{zone_info}")
        except Exception as e:
            logger.error(f"Failed to register agent in game: {e}")
            # Don't fail the whole request, just log the error
            game_registration = {"error": str(e)}

    return {
        "success": True,
        "agent_id": agent_id,
        "current_node": agent_state.current_node,
        "message": f"Agent '{agent_id}' added successfully",
        "game_registration": game_registration
    }


@app.post("/register-agents-in-game")
async def register_agents_in_game():
    """
    Register all backend agents in the game environment.
    Call this after adding agents with /add-agent.
    """
    if game_session.active:
        raise HTTPException(
            status_code=400,
            detail="Game session already active"
        )

    if not agents:
        raise HTTPException(
            status_code=400,
            detail="No agents to register. Add agents first using /add-agent"
        )

    logger.info(f"Registering {len(agents)} agents in game environment")

    # Register all agents that aren't already registered
    registration_results = {}
    agent_programs = {}

    for agent_id in agents.keys():
        agent_state = agents[agent_id]

        # Store the agent program data for frontend visualization
        agent_programs[agent_id] = {
            "blocks": [block.dict() for block in agent_state.program.blocks],
            "agent_id": agent_id
        }

        if agent_id not in game_session.registered_agents:
            try:
                result = await game_client.register_agent(agent_id, f"AI_{agent_id}")
                game_session.registered_agents[agent_id] = True
                registration_results[agent_id] = {
                    "success": True,
                    "position": result.get("position")
                }
                logger.info(f"Registered agent {agent_id} in game")
            except Exception as e:
                logger.error(f"Failed to register agent {agent_id}: {e}")
                registration_results[agent_id] = {
                    "success": False,
                    "error": str(e)
                }
        else:
            registration_results[agent_id] = {"success": True, "already_registered": True}

    game_session.active = True
    game_session.step_count = 0

    return {
        "success": True,
        "agents_registered": len(game_session.registered_agents),
        "registration_results": registration_results,
        "agent_programs": agent_programs
    }


async def process_single_agent_step(
    agent_id: str,
    game_states: Dict[str, Any]
) -> tuple[str, Dict[str, Any]]:
    """
    Process a single agent's step. Returns (agent_id, result_dict).
    This function is designed to be called concurrently for multiple agents.
    """
    if agent_id not in game_states:
        logger.warning(f"No game state for agent {agent_id}, skipping")
        return agent_id, {"error": "No game state available"}

    if agent_id not in agents:
        logger.warning(f"Agent {agent_id} not in backend state, skipping")
        return agent_id, {"error": "Agent not in backend"}

    try:
        game_state_dict = game_states[agent_id]

        # Create request for existing next-step-for-agents endpoint
        next_step_request = NextStepRequest(
            agent_id=agent_id,
            game_state=GameState(**game_state_dict)
        )

        # Call existing Dedalus-based next-step logic
        next_step_response = await next_step_for_agents(next_step_request)

        # If there's an action, send it to the game environment
        if next_step_response.action:
            action = next_step_response.action
            command_result = await game_client.send_command(
                agent_id,
                action.tool_type,
                action.parameters
            )

            return agent_id, {
                "action": action.tool_type,
                "parameters": action.parameters,
                "next_node": next_step_response.current_node,
                "game_response": command_result.get("success", False)
            }
        else:
            return agent_id, {
                "action": None,
                "reason": "No action from agent",
                "next_node": next_step_response.current_node
            }

    except HTTPException as e:
        if e.status_code == 408:  # Timeout
            logger.warning(f"⏱️ Agent {agent_id} timed out - skipping turn")
            return agent_id, {"error": "timeout", "message": "LLM request timed out", "skipped": True}
        else:
            logger.error(f"HTTP error processing agent {agent_id}: {e.detail}")
            return agent_id, {"error": str(e.detail)}
    except Exception as e:
        logger.error(f"Error processing agent {agent_id}: {e}")
        return agent_id, {"error": str(e)}


@app.post("/execute-game-step")
async def execute_game_step():
    """
    Execute one game step for all agents using the existing Dedalus system:
    1. Get game state for each agent from game environment
    2. Call /next-step-for-agents for each agent (uses Dedalus LLM) - ALL SIMULTANEOUSLY
    3. Send actions back to game environment
    """
    if not game_session.active:
        raise HTTPException(
            status_code=400,
            detail="No active game session. Call /register-agents-in-game first"
        )

    registered_agents = list(game_session.registered_agents.keys())
    if not registered_agents:
        raise HTTPException(
            status_code=400,
            detail="No agents registered in game"
        )

    logger.info(f"Executing game step {game_session.step_count + 1} for {len(registered_agents)} agents")
    step_start_time = asyncio.get_event_loop().time()

    # Step 1: Get game states for all agents in parallel
    game_states = await game_client.batch_get_states(registered_agents)
    logger.info(f"Retrieved game states for {len(game_states)} agents")

    # Step 2 & 3: Process all agents simultaneously using asyncio.gather
    tasks = [
        process_single_agent_step(agent_id, game_states)
        for agent_id in registered_agents
    ]

    logger.info(f"Processing {len(tasks)} agents simultaneously (max {LLM_TIMEOUT}s per agent)")
    llm_start_time = asyncio.get_event_loop().time()
    results_list = await asyncio.gather(*tasks, return_exceptions=True)
    llm_duration = asyncio.get_event_loop().time() - llm_start_time
    logger.info(f"✅ All agents processed in {llm_duration:.2f}s")

    # Collect results into dictionary
    step_results = {}
    for result in results_list:
        if isinstance(result, Exception):
            logger.error(f"Error in agent processing: {result}")
            # We can't identify which agent failed in this case
            continue
        agent_id, agent_result = result
        step_results[agent_id] = agent_result

    game_session.step_count += 1
    total_step_time = asyncio.get_event_loop().time() - step_start_time
    logger.info(f"📊 Step {game_session.step_count} complete in {total_step_time:.2f}s total")

    return {
        "success": True,
        "step": game_session.step_count,
        "agents_processed": len(step_results),
        "step_duration": round(total_step_time, 2),
        "results": step_results
    }


@app.post("/start-auto-stepping")
async def start_auto_stepping(step_delay: Optional[float] = None):
    """
    Start automatic stepping at specified interval.

    Args:
        step_delay: Delay in seconds between steps (default: from STEP_DELAY env variable, currently {})
    """.format(DEFAULT_STEP_DELAY)
    if not game_session.active:
        raise HTTPException(
            status_code=400,
            detail="No active game session. Call /register-agents-in-game first"
        )

    if game_session.auto_stepping:
        raise HTTPException(
            status_code=400,
            detail="Auto-stepping already active"
        )

    game_session.auto_stepping = True
    game_session.step_delay = step_delay if step_delay is not None else DEFAULT_STEP_DELAY

    # Start background task
    asyncio.create_task(auto_step_loop())

    return {
        "success": True,
        "auto_stepping": True,
        "step_delay": step_delay
    }


@app.post("/stop-auto-stepping")
async def stop_auto_stepping():
    """Stop automatic stepping"""
    game_session.auto_stepping = False

    return {
        "success": True,
        "auto_stepping": False,
        "final_step": game_session.step_count
    }


@app.post("/cleanup-game-session")
async def cleanup_game_session():
    """
    Stop the game session and clean up all agents from the game environment.
    """
    if not game_session.active:
        raise HTTPException(
            status_code=400,
            detail="No active game session"
        )

    # Stop auto-stepping if active
    game_session.auto_stepping = False

    # Remove all agents from game environment
    removal_results = {}
    for agent_id in list(game_session.registered_agents.keys()):
        try:
            await game_client.remove_agent(agent_id)
            removal_results[agent_id] = {"success": True}
            logger.info(f"Removed agent {agent_id} from game")
        except Exception as e:
            logger.error(f"Failed to remove agent {agent_id}: {e}")
            removal_results[agent_id] = {"success": False, "error": str(e)}

    # Clear session state
    game_session.registered_agents.clear()
    game_session.active = False
    final_step = game_session.step_count
    game_session.step_count = 0

    return {
        "success": True,
        "session_active": False,
        "final_step": final_step,
        "removal_results": removal_results
    }


@app.get("/game-session-status")
async def get_game_session_status():
    """Get current game session status"""
    game_status = None
    if game_session.active:
        try:
            game_status = await game_client.get_status()
        except Exception as e:
            logger.error(f"Failed to get game status: {e}")
            game_status = {"error": str(e)}

    return {
        "session_active": game_session.active,
        "auto_stepping": game_session.auto_stepping,
        "step_count": game_session.step_count,
        "step_delay": game_session.step_delay,
        "agents_in_backend": len(agents),
        "agents_in_game": len(game_session.registered_agents),
        "game_server_status": game_status
    }


@app.get("/agents-state")
async def get_agents_state():
    """
    Get current execution state for all agents.
    Returns the current node being executed for each agent.
    """
    agent_states = {}
    for agent_id, agent_state in agents.items():
        agent_states[agent_id] = {
            "agent_id": agent_id,
            "current_node": agent_state.current_node,
            "last_executed_tool_block": agent_state.last_executed_tool_block,
            "last_agent_block": agent_state.last_agent_block,
        }

    return {
        "success": True,
        "agents": agent_states,
        "session_active": game_session.active,
        "step_count": game_session.step_count
    }


async def auto_step_loop():
    """Background task for automatic stepping with dynamic delays"""
    logger.info(f"Auto-stepping started (min interval: {game_session.step_delay}s)")
    while game_session.auto_stepping and game_session.active:
        step_start = asyncio.get_event_loop().time()

        try:
            result = await execute_game_step()
            step_duration = result.get("step_duration", 0)
            logger.info(f"Auto-step {game_session.step_count} completed in {step_duration}s")

            # Only wait if we completed faster than step_delay
            remaining_time = game_session.step_delay - step_duration
            if remaining_time > 0:
                logger.info(f"⏳ Waiting {remaining_time:.2f}s before next step (min interval)")
                await asyncio.sleep(remaining_time)
            else:
                logger.info(f"🚀 Starting next step immediately (took {step_duration}s)")

        except Exception as e:
            logger.error(f"Error in auto-step: {e}")
            # Continue even if there's an error, wait full delay on error
            await asyncio.sleep(game_session.step_delay)

    logger.info("Auto-stepping stopped")


@app.post("/next-step-for-agents")
async def next_step_for_agents(request: NextStepRequest) -> NextStepResponse:
    """
    Execute the next step for an agent based on current game state.

    This endpoint:
    1. Checks if an action occurred (e.g., "attacked") and switches to the appropriate entry block
    2. If the current block is an agent block, uses Dedalus to decide which tool to use
    3. Returns the action to take and updates the agent's current node
    """
    agent_id = request.agent_id
    logger.info(f"next-step-for-agents called for agent: {agent_id}, action_occurred: {request.action_occurred}")

    # Check if agent exists
    if agent_id not in agents:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID '{agent_id}' not found"
        )

    agent_state = agents[agent_id]
    current_node_id = agent_state.current_node

    # Handle action triggers (e.g., "attacked")
    if request.action_occurred:
        # Find the corresponding action block
        action_block = None
        for block in agent_state.program.blocks:
            if isinstance(block, ActionBlock) and block.action_type == f"on{request.action_occurred.capitalize()}":
                action_block = block
                break

        if action_block and action_block.next:
            # Switch to the action block's next node
            current_node_id = action_block.next
            agent_state.current_node = current_node_id

    # If there's no current node, fall back to the last agent block (for looping)
    if not current_node_id:
        if agent_state.last_agent_block:
            logger.info(f"No current node, falling back to last agent block: {agent_state.last_agent_block}")
            current_node_id = agent_state.last_agent_block
            agent_state.current_node = current_node_id
        else:
            logger.warning(f"No current node and no last agent block for agent {agent_id}")
            return NextStepResponse(
                agent_id=agent_id,
                action=None,
                current_node=None
            )

    # Find the current block
    current_block = None
    for block in agent_state.program.blocks:
        if block.id == current_node_id:
            current_block = block
            break

    if not current_block:
        raise HTTPException(
            status_code=500,
            detail=f"Current node '{current_node_id}' not found in agent's program"
        )

    # If current block is not an agent block, return error
    # (Tool blocks should be executed by the game backend, not here)
    if not isinstance(current_block, AgentBlock):
        raise HTTPException(
            status_code=400,
            detail=f"Current node '{current_node_id}' is not an agent block. Only agent blocks can be executed via this endpoint."
        )

    # Track this agent block for looping
    agent_state.last_agent_block = current_block.id

    # Execute the agent block using Dedalus
    tool_choice, parameters, reasoning = await execute_agent_block(
        current_block,
        request.game_state,
        agent_state.program.blocks,
        agent_state.current_plan,
        agent_state.past_actions
    )

    # Find the tool block corresponding to the chosen tool
    chosen_tool_block = None
    for conn in current_block.tool_connections:
        if conn.tool_name == tool_choice:
            # Find the actual tool block
            for block in agent_state.program.blocks:
                if block.id == conn.tool_id:
                    chosen_tool_block = block
                    break
            break

    if not chosen_tool_block:
        raise HTTPException(
            status_code=500,
            detail=f"Tool block for '{tool_choice}' not found"
        )

    # If the tool is "plan", store the plan in agent state
    if tool_choice == "plan" and "plan" in parameters:
        agent_state.current_plan = parameters["plan"]
        logger.info(f"Stored plan for agent {agent_id}: {agent_state.current_plan}")

    # If the tool is "search", log the search query and results will come from MCP
    if tool_choice == "search" and "query" in parameters:
        logger.info(f"Agent {agent_id} searching for: {parameters['query']}")

    # Store this action in the agent's action history
    action_record = {
        "action": tool_choice,
        "parameters": parameters,
        "reasoning": reasoning
    }
    agent_state.past_actions.append(action_record)

    # Keep only the most recent MAX_ACTION_HISTORY actions
    if len(agent_state.past_actions) > MAX_ACTION_HISTORY:
        agent_state.past_actions = agent_state.past_actions[-MAX_ACTION_HISTORY:]

    logger.info(f"Stored action in history. Total actions in history: {len(agent_state.past_actions)}")

    # Store the executed tool block for animation tracking
    agent_state.last_executed_tool_block = chosen_tool_block.id
    logger.info(f"🎬 Animation tracking: agent={agent_id}, tool_block={chosen_tool_block.id}, next_node={chosen_tool_block.next}")

    # Update the agent's current node to the tool block's next node
    agent_state.current_node = chosen_tool_block.next

    # Create the action response
    action = ToolAction(
        tool_type=tool_choice,
        parameters=parameters
    )

    return NextStepResponse(
        agent_id=agent_id,
        action=action,
        current_node=agent_state.current_node
    )


class ChatMessage(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="The user's message")
    lesson_title: Optional[str] = Field(None, description="Title of the current lesson")
    lesson_guidelines: Optional[List[str]] = Field(None, description="Guidelines for the current lesson")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="The assistant's response")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatMessage) -> ChatResponse:
    """
    Chat endpoint that uses OpenAI to provide helpful responses about the lesson.
    """
    if not openai_client:
        raise HTTPException(
            status_code=503,
            detail="Chat functionality is not available. OPENAI_API_KEY not configured."
        )
    
    try:
        # Build system prompt with lesson context
        system_prompt = """You are discer, a helpful AI teaching assistant for an agentic AI learning platform. 
You help students understand agentic AI concepts and guide them through building AI agents using a visual block-based programming interface.

Be friendly, encouraging, and provide clear explanations. If students ask about specific blocks or concepts, explain them in the context of building agentic AI systems.
Keep responses concise but informative. If you don't know something specific about the platform, say so honestly."""

        user_prompt = request.message
        
        # Add lesson context if available
        if request.lesson_title:
            user_prompt = f"Lesson: {request.lesson_title}\n\n{user_prompt}"
        
        if request.lesson_guidelines:
            guidelines_text = "\n".join([f"- {g}" for g in request.lesson_guidelines])
            user_prompt = f"{user_prompt}\n\nLesson Guidelines:\n{guidelines_text}"

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        assistant_message = response.choices[0].message.content
        
        return ChatResponse(response=assistant_message)
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate chat response: {str(e)}"
        )


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


if __name__ == "__main__":
    main()
