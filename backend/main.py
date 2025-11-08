from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Union, Dict, Any
from enum import Enum
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Pydantic Models for Block Types

class ToolConnection(BaseModel):
    """Connection from an Agent block to a Tool block"""
    tool_id: str = Field(..., description="ID of the tool block to connect to")
    tool_name: Literal["move", "attack", "collect", "plan"] = Field(
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
    model: str = Field(..., description="LLM model to use (e.g., claude-3-5-sonnet-20241022)")
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
    tool_type: Literal["move", "attack", "collect", "plan"] = Field(
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
    health: Optional[int] = None
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
    tool_type: Literal["move", "attack", "collect", "plan"]
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

# Initialize Dedalus client
dedalus_client = AsyncDedalus()
dedalus_runner = DedalusRunner(dedalus_client)


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
    current_plan: Optional[str] = None
) -> tuple[str, Dict[str, Any]]:
    """
    Execute an agent block using Dedalus SDK to decide which tool to use.
    Returns a tuple of (tool_name, parameters).
    """
    logger.info(f"Executing agent block: {agent_block.id}")

    # Convert game state to LLM-readable format
    game_state_str = game_state_to_llm_format(game_state)
    logger.info(f"Game state: {game_state_str}")

    # Add current plan to context if available
    if current_plan:
        logger.info(f"Current plan: {current_plan}")
        game_state_str += f"\n\nCurrent strategic plan: {current_plan}"

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

    # Check if plan tool is available
    has_plan_tool = "plan" in available_tools

    # Construct the input prompt
    user_input = (
        f"{agent_block.user_prompt}\n\n"
        f"Current game state: {game_state_str}\n\n"
        f"Available actions:\n" + "\n".join(f"- {info}" for info in available_tools_info) + "\n\n"
        f"Respond with a JSON object containing 'action' (the action name) and 'parameters' (an object with the required parameters).\n"
        f"Example: {{\"action\": \"move\", \"parameters\": {{\"x\": 5, \"y\": -2}}}}"
    )

    full_input = agent_block.system_prompt + "\n\n" + user_input
    logger.info(f"LLM Input:\n{full_input}")

    # Call Dedalus with MCP server access if plan tool is available
    logger.info(f"Calling LLM with model: {agent_block.model}")
    if has_plan_tool:
        logger.info("Plan tool detected, including MCP server access")
        response = await dedalus_runner.run(
            input=full_input, # TODO: remove this once we figure out how to pass the system prompt
            model=agent_block.model,
            mcp_servers=["raptors65/hack-princeton-mcp"],
            #system=agent_block.system_prompt # TODO: how do I pass system messages in Dedalus??
        )
    else:
        response = await dedalus_runner.run(
            input=full_input, # TODO: remove this once we figure out how to pass the system prompt
            model=agent_block.model,
            #system=agent_block.system_prompt # TODO: how do I pass system messages in Dedalus??
        )

    # Extract the tool name and parameters from the response
    logger.info(f"LLM Raw Output: {response.final_output}")

    # Try to parse JSON response
    import json
    try:
        response_json = json.loads(response.final_output.strip())
        tool_choice = response_json.get("action", "").lower()
        parameters = response_json.get("parameters", {})
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON response, attempting fallback parsing")
        # Fallback: try to extract just the tool name
        tool_choice = response.final_output.strip().lower()
        parameters = {}

    # Validate that the chosen tool is in the available tools
    if tool_choice not in available_tools:
        logger.warning(f"LLM chose invalid tool '{tool_choice}', defaulting to '{available_tools[0]}'")
        # Default to the first available tool if the response is invalid
        tool_choice = available_tools[0]
        parameters = {}

    logger.info(f"Selected tool: {tool_choice} with parameters: {parameters}")

    return tool_choice, parameters


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
async def add_agent(program: ProgramSchema):
    """
    Add a new agent to the game with its Scratch-like program.

    The agent will start executing from the 'onStart' action block.
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

    # Add agent to game state
    agents[agent_id] = agent_state

    return {
        "success": True,
        "agent_id": agent_id,
        "current_node": agent_state.current_node,
        "message": f"Agent '{agent_id}' added successfully"
    }


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

    # If there's no current node, return None for the action
    if not current_node_id:
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

    # Execute the agent block using Dedalus
    tool_choice, parameters = await execute_agent_block(
        current_block,
        request.game_state,
        agent_state.program.blocks,
        agent_state.current_plan
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


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
