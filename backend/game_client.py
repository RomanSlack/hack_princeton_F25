"""
Game Environment Client
Handles all communication with the game server API
"""

import httpx
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class GameEnvironmentClient:
    """Client for interacting with the game environment API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    async def get_status(self) -> Dict[str, Any]:
        """Get game server status"""
        try:
            response = await self.client.get(f"{self.base_url}/api/status")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get game status: {e}")
            raise

    async def register_agent(self, agent_id: str, username: Optional[str] = None) -> Dict[str, Any]:
        """
        Register a new AI agent in the game environment.

        Args:
            agent_id: Unique identifier for the agent
            username: Optional display name for the agent

        Returns:
            Registration response with initial game state
        """
        try:
            payload = {"agent_id": agent_id}
            if username:
                payload["username"] = username

            response = await self.client.post(
                f"{self.base_url}/api/agent/register",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Registered agent {agent_id} at position {data.get('position')}")
            return data
        except Exception as e:
            logger.error(f"Failed to register agent {agent_id}: {e}")
            raise

    async def get_agent_state(self, agent_id: str) -> Dict[str, Any]:
        """
        Get current game state for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Game state including position, health, nearby entities, etc.
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/api/agent/state/{agent_id}"
            )
            response.raise_for_status()
            data = response.json()
            return data.get("game_state", {})
        except Exception as e:
            logger.error(f"Failed to get state for agent {agent_id}: {e}")
            raise

    async def send_command(
        self,
        agent_id: str,
        tool_type: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send an action command to an agent.

        Args:
            agent_id: Agent identifier
            tool_type: Type of action (move, attack, collect, plan)
            parameters: Action parameters

        Returns:
            Command response with updated game state
        """
        try:
            payload = {
                "agent_id": agent_id,
                "action": {
                    "tool_type": tool_type,
                    "parameters": parameters
                }
            }

            response = await self.client.post(
                f"{self.base_url}/api/agent/command",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Sent command {tool_type} to agent {agent_id}")
            return data
        except Exception as e:
            logger.error(f"Failed to send command to agent {agent_id}: {e}")
            raise

    async def remove_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Remove an agent from the game.

        Args:
            agent_id: Agent identifier

        Returns:
            Removal confirmation
        """
        try:
            response = await self.client.delete(
                f"{self.base_url}/api/agent/{agent_id}"
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Removed agent {agent_id}")
            return data
        except Exception as e:
            logger.error(f"Failed to remove agent {agent_id}: {e}")
            raise

    async def batch_get_states(self, agent_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Get game states for multiple agents in parallel.

        Args:
            agent_ids: List of agent identifiers

        Returns:
            Dictionary mapping agent_id to game state
        """
        import asyncio

        async def get_state(agent_id: str):
            try:
                state = await self.get_agent_state(agent_id)
                return agent_id, state
            except Exception as e:
                logger.error(f"Failed to get state for {agent_id}: {e}")
                return agent_id, None

        tasks = [get_state(agent_id) for agent_id in agent_ids]
        results = await asyncio.gather(*tasks)

        return {agent_id: state for agent_id, state in results if state is not None}
