"""
Test script for backend <-> game environment integration
Demonstrates the complete flow of running AI agents in the game
"""

import requests
import time
import json

BACKEND_URL = "http://localhost:8001"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def add_agent(agent_id, username):
    """Add an agent with a simple decision-making program"""
    program = {
        "agent_id": agent_id,
        "blocks": [
            {
                "id": "on_start",
                "type": "action",
                "action_type": "onStart",
                "next": "decide_action"
            },
            {
                "id": "decide_action",
                "type": "agent",
                "model": "claude-3-5-sonnet-20241022",
                "system_prompt": "You are a battle royale AI agent. Make smart tactical decisions.",
                "user_prompt": "Analyze the game state and choose your best next action. Consider nearby enemies, loot, and your current health.",
                "tool_connections": [
                    {"tool_id": "move_tool", "tool_name": "move"},
                    {"tool_id": "attack_tool", "tool_name": "attack"},
                    {"tool_id": "collect_tool", "tool_name": "collect"}
                ]
            },
            {
                "id": "move_tool",
                "type": "tool",
                "tool_type": "move",
                "parameters": {"x": "number", "y": "number"},
                "next": "decide_action"
            },
            {
                "id": "attack_tool",
                "type": "tool",
                "tool_type": "attack",
                "parameters": {"target_player_id": "string"},
                "next": "decide_action"
            },
            {
                "id": "collect_tool",
                "type": "tool",
                "tool_type": "collect",
                "parameters": {},
                "next": "decide_action"
            }
        ]
    }

    response = requests.post(
        f"{BACKEND_URL}/add-agent",
        json=program
    )
    response.raise_for_status()
    print(f"✓ Added agent: {agent_id}")
    return response.json()


def start_session():
    """Start the game session and register all agents"""
    response = requests.post(f"{BACKEND_URL}/start-game-session")
    response.raise_for_status()
    data = response.json()
    print(f"✓ Game session started")
    print(f"  Agents registered: {data['agents_registered']}")
    for agent_id, result in data['registration_results'].items():
        if result.get('success'):
            pos = result.get('position', {})
            print(f"  - {agent_id} at ({pos.get('x', 0):.1f}, {pos.get('y', 0):.1f})")
    return data


def execute_step():
    """Execute one game step"""
    response = requests.post(f"{BACKEND_URL}/game-step")
    response.raise_for_status()
    data = response.json()
    print(f"✓ Step {data['step']} completed - {data['agents_processed']} agents processed")

    for agent_id, result in data['results'].items():
        if 'action' in result:
            action = result['action']
            params = result.get('parameters', {})
            if action == 'move':
                print(f"  {agent_id}: Moving by ({params.get('x', 0)}, {params.get('y', 0)})")
            elif action == 'attack':
                print(f"  {agent_id}: Attacking {params.get('target_player_id', 'unknown')}")
            elif action == 'collect':
                print(f"  {agent_id}: Collecting items")
            else:
                print(f"  {agent_id}: {action}")
        elif 'error' in result:
            print(f"  {agent_id}: Error - {result['error']}")

    return data


def get_status():
    """Get current session status"""
    response = requests.get(f"{BACKEND_URL}/game-session-status")
    response.raise_for_status()
    data = response.json()
    print(f"Session Status:")
    print(f"  Active: {data['session_active']}")
    print(f"  Step: {data['step_count']}")
    print(f"  Agents in backend: {data['agents_in_backend']}")
    print(f"  Agents in game: {data['agents_in_game']}")
    if data.get('game_server_status'):
        gs = data['game_server_status']
        print(f"  Game server: {'Online' if gs.get('online') else 'Offline'}")
        print(f"  Players in game: {gs.get('players', 0)}")
        print(f"  AI agents in game: {gs.get('aiAgents', 0)}")
    return data


def stop_session():
    """Stop the game session"""
    response = requests.post(f"{BACKEND_URL}/stop-game-session")
    response.raise_for_status()
    data = response.json()
    print(f"✓ Game session stopped")
    print(f"  Final step: {data['final_step']}")
    return data


def main():
    print_section("Backend <-> Game Environment Integration Test")

    try:
        # Step 1: Add agents
        print_section("Step 1: Adding Agents to Backend")
        agents = ["bot_001", "bot_002", "bot_003"]
        for agent_id in agents:
            add_agent(agent_id, f"AI_{agent_id}")
            time.sleep(0.5)

        # Step 2: Start game session
        print_section("Step 2: Starting Game Session")
        start_session()
        time.sleep(1)

        # Step 3: Check initial status
        print_section("Step 3: Initial Status")
        get_status()

        # Step 4: Execute manual steps
        print_section("Step 4: Executing Manual Steps")
        for i in range(5):
            print(f"\n--- Step {i+1} ---")
            execute_step()
            time.sleep(2)  # Wait for game to process

        # Step 5: Check status again
        print_section("Step 5: Status After Steps")
        get_status()

        # Step 6: Test auto-stepping
        print_section("Step 6: Testing Auto-Stepping")
        print("Starting auto-stepping (5 seconds)...")
        response = requests.post(f"{BACKEND_URL}/start-auto-stepping?step_delay=1.0")
        response.raise_for_status()
        print("✓ Auto-stepping started")

        # Let it run for a bit
        time.sleep(5)

        print("\nStopping auto-stepping...")
        response = requests.post(f"{BACKEND_URL}/stop-auto-stepping")
        response.raise_for_status()
        print("✓ Auto-stepping stopped")

        # Step 7: Final status
        print_section("Step 7: Final Status")
        get_status()

        # Step 8: Stop session
        print_section("Step 8: Stopping Game Session")
        stop_session()

        print_section("Test Completed Successfully!")
        print("\n✓ All tests passed!")
        print("\nNext steps:")
        print("  1. Check the game client (http://localhost:3000) to see agents in action")
        print("  2. Review backend logs for LLM decision details")
        print("  3. Experiment with different agent programs")

    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to backend server")
        print("   Make sure the backend is running: uv run python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
