#!/usr/bin/env python3
"""
Demo script to register multiple agents with different strategies.
Run this after starting the backend server.
"""

import requests
import json
import time

BACKEND_URL = "http://localhost:8001"

def create_aggressive_agent():
    """Create an aggressive agent that prioritizes attacking"""
    return {
        "agent_id": "aggressive_bot",
        "blocks": [
            {
                "id": "start_1",
                "type": "action",
                "action_type": "onStart",
                "next": "agent_1"
            },
            {
                "id": "agent_1",
                "type": "agent",
                "model": "openai/gpt-4o-mini",
                "system_prompt": "You are an aggressive combat AI. Your goal is to eliminate enemies.",
                "user_prompt": "Analyze the battlefield and choose your action. Prioritize attacking nearby enemies when possible.",
                "tool_connections": [
                    {"tool_id": "move_1", "tool_name": "move"},
                    {"tool_id": "attack_1", "tool_name": "attack"}
                ]
            },
            {
                "id": "move_1",
                "type": "tool",
                "tool_type": "move",
                "parameters": {"x": "number", "y": "number"},
                "next": "agent_1"
            },
            {
                "id": "attack_1",
                "type": "tool",
                "tool_type": "attack",
                "parameters": {"target_player_id": "string"},
                "next": "agent_1"
            }
        ]
    }

def create_defensive_agent():
    """Create a defensive agent that focuses on survival"""
    return {
        "agent_id": "defensive_bot",
        "blocks": [
            {
                "id": "start_2",
                "type": "action",
                "action_type": "onStart",
                "next": "agent_2"
            },
            {
                "id": "agent_2",
                "type": "agent",
                "model": "openai/gpt-4o-mini",
                "system_prompt": "You are a defensive survival AI. Your goal is to stay alive by avoiding danger.",
                "user_prompt": "Analyze your surroundings and move strategically to avoid enemies. Keep your distance and survive.",
                "tool_connections": [
                    {"tool_id": "move_2", "tool_name": "move"},
                    {"tool_id": "attack_2", "tool_name": "attack"}
                ]
            },
            {
                "id": "move_2",
                "type": "tool",
                "tool_type": "move",
                "parameters": {"x": "number", "y": "number"},
                "next": "agent_2"
            },
            {
                "id": "attack_2",
                "type": "tool",
                "tool_type": "attack",
                "parameters": {"target_player_id": "string"},
                "next": "agent_2"
            }
        ]
    }

def create_collector_agent():
    """Create an agent that focuses on collecting items"""
    return {
        "agent_id": "collector_bot",
        "blocks": [
            {
                "id": "start_3",
                "type": "action",
                "action_type": "onStart",
                "next": "agent_3"
            },
            {
                "id": "agent_3",
                "type": "agent",
                "model": "openai/gpt-4o-mini",
                "system_prompt": "You are a resourceful scavenger AI. Your goal is to collect items and stay equipped.",
                "user_prompt": "Look for items to collect. Move strategically to find loot while avoiding combat when possible.",
                "tool_connections": [
                    {"tool_id": "move_3", "tool_name": "move"},
                    {"tool_id": "collect_3", "tool_name": "collect"},
                    {"tool_id": "attack_3", "tool_name": "attack"}
                ]
            },
            {
                "id": "move_3",
                "type": "tool",
                "tool_type": "move",
                "parameters": {"x": "number", "y": "number"},
                "next": "agent_3"
            },
            {
                "id": "collect_3",
                "type": "tool",
                "tool_type": "collect",
                "parameters": {},
                "next": "agent_3"
            },
            {
                "id": "attack_3",
                "type": "tool",
                "tool_type": "attack",
                "parameters": {"target_player_id": "string"},
                "next": "agent_3"
            }
        ]
    }

def create_strategic_agent():
    """Create a strategic agent that uses planning"""
    return {
        "agent_id": "strategic_bot",
        "blocks": [
            {
                "id": "start_4",
                "type": "action",
                "action_type": "onStart",
                "next": "agent_4"
            },
            {
                "id": "agent_4",
                "type": "agent",
                "model": "anthropic/claude-3-5-sonnet",
                "system_prompt": "You are a strategic tactical AI. You plan ahead and execute coordinated strategies.",
                "user_prompt": "Analyze the situation and make strategic decisions. Use planning to coordinate your actions effectively.",
                "tool_connections": [
                    {"tool_id": "move_4", "tool_name": "move"},
                    {"tool_id": "attack_4", "tool_name": "attack"},
                    {"tool_id": "plan_4", "tool_name": "plan"}
                ]
            },
            {
                "id": "move_4",
                "type": "tool",
                "tool_type": "move",
                "parameters": {"x": "number", "y": "number"},
                "next": "agent_4"
            },
            {
                "id": "attack_4",
                "type": "tool",
                "tool_type": "attack",
                "parameters": {"target_player_id": "string"},
                "next": "agent_4"
            },
            {
                "id": "plan_4",
                "type": "tool",
                "tool_type": "plan",
                "parameters": {"plan": "string"},
                "next": "agent_4"
            }
        ]
    }

def register_agent(agent_data):
    """Register an agent with the backend"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/add-agent",
            json=agent_data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Registered agent: {result['agent_id']}")
            print(f"   Current node: {result.get('current_node', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to register {agent_data['agent_id']}: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error registering {agent_data['agent_id']}: {e}")
        return False

def main():
    print("🤖 Demo Agent Registration Script")
    print("=" * 50)
    print(f"Backend URL: {BACKEND_URL}")
    print()

    # Create agent definitions
    agents = [
        create_aggressive_agent(),
        create_defensive_agent(),
        # create_collector_agent(),
        # create_strategic_agent()
    ]

    # Register each agent
    successful = 0
    for i, agent in enumerate(agents, 1):
        print(f"\n[{i}/{len(agents)}] Registering {agent['agent_id']}...")
        if register_agent(agent):
            successful += 1
        time.sleep(0.5)  # Small delay between registrations

    print("\n" + "=" * 50)
    print(f"✨ Registration complete: {successful}/{len(agents)} agents registered")
    print()
    print("Next steps:")
    print("1. Open the game at http://localhost:3000")
    print("2. Click PLAY to join the game")
    print("3. The backend will register agents and start auto-stepping")
    print()

if __name__ == "__main__":
    main()
