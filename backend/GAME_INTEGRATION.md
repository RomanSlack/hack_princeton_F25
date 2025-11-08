# Backend ↔ Game Environment Integration

Complete guide for the integrated system where the backend controls AI agents in the game environment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Server                            │
│                     (FastAPI - Port 8000)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Agent Programs (Block-based with LLM decision making)   │   │
│  │  - Agent 1: bot_001                                      │   │
│  │  - Agent 2: bot_002                                      │   │
│  │  - Agent 3: bot_003                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        Game Coordinator (game_client.py)                 │   │
│  │  - Fetches game state for all agents                     │   │
│  │  - Processes each agent through LLM                      │   │
│  │  - Sends actions back to game                            │   │
│  │  - Manages step timing                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP REST API
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Game Environment Server                       │
│                      (Bun - Port 8000)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Game Loop (40 TPS)                          │   │
│  │  - Physics simulation                                     │   │
│  │  - Collision detection                                    │   │
│  │  - Bullet trajectories                                    │   │
│  │  - Health/damage system                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           AI Agents (server/src/objects/aiAgent.ts)      │   │
│  │  - bot_001 (AIAgent)                                     │   │
│  │  - bot_002 (AIAgent)                                     │   │
│  │  - bot_003 (AIAgent)                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Workflow

### 1. Setup Phase

**Step 1.1: Start Game Server**
```bash
cd game_environment
bun dev:server
```

**Step 1.2: Start Backend Server**
```bash
cd backend
uv sync  # Install dependencies (includes httpx)
uv run python main.py
```

### 2. Agent Registration Phase

**Step 2.1: Add Agents to Backend**

Each agent has a block-based program that defines their behavior:

```bash
curl -X POST http://localhost:8000/add-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
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
        "system_prompt": "You are a battle royale AI agent.",
        "user_prompt": "Analyze the situation and choose your next action.",
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
  }'
```

**Step 2.2: Start Game Session**

This registers all agents in the game environment:

```bash
curl -X POST http://localhost:8000/start-game-session
```

Response:
```json
{
  "success": true,
  "session_active": true,
  "agents_registered": 3,
  "registration_results": {
    "bot_001": {
      "success": true,
      "position": {"x": 100, "y": 200}
    },
    "bot_002": {
      "success": true,
      "position": {"x": 300, "y": 150}
    },
    "bot_003": {
      "success": true,
      "position": {"x": 250, "y": 350}
    }
  }
}
```

### 3. Game Execution Phase

#### Option A: Manual Stepping

Execute one step at a time for full control:

```bash
curl -X POST http://localhost:8000/game-step
```

**What happens in one step:**
1. Backend fetches game state for all agents (parallel)
2. For each agent:
   - Passes game state to agent's LLM
   - LLM decides which tool to use
   - Backend sends action to game environment
3. Returns results for all agents

Response:
```json
{
  "success": true,
  "step": 1,
  "agents_processed": 3,
  "results": {
    "bot_001": {
      "action": "move",
      "parameters": {"x": 15, "y": -10},
      "next_node": "decide_action",
      "game_response": true
    },
    "bot_002": {
      "action": "attack",
      "parameters": {"target_player_id": "bot_001"},
      "next_node": "decide_action",
      "game_response": true
    },
    "bot_003": {
      "action": "collect",
      "parameters": {},
      "next_node": "decide_action",
      "game_response": true
    }
  }
}
```

#### Option B: Automatic Stepping

Start continuous execution with configurable delay:

```bash
# Start auto-stepping (1 second between steps)
curl -X POST http://localhost:8000/start-auto-stepping?step_delay=1.0

# Stop auto-stepping
curl -X POST http://localhost:8000/stop-auto-stepping
```

### 4. Monitoring Phase

**Check Session Status:**
```bash
curl http://localhost:8000/game-session-status
```

Response:
```json
{
  "session_active": true,
  "auto_stepping": true,
  "step_count": 42,
  "step_delay": 1.0,
  "agents_in_backend": 3,
  "agents_in_game": 3,
  "game_server_status": {
    "online": true,
    "players": 0,
    "aiAgents": 3,
    "uptime": 125.3
  }
}
```

### 5. Cleanup Phase

**Stop Session:**
```bash
curl -X POST http://localhost:8000/stop-game-session
```

This will:
- Stop auto-stepping if active
- Remove all agents from game environment
- Clear session state
- Return final step count

## API Endpoints Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/add-agent` | POST | Add agent with block program to backend |
| `/start-game-session` | POST | Register all agents in game environment |
| `/game-step` | POST | Execute one step for all agents |
| `/start-auto-stepping` | POST | Start automatic stepping |
| `/stop-auto-stepping` | POST | Stop automatic stepping |
| `/stop-game-session` | POST | End session and cleanup |
| `/game-session-status` | GET | Get current session status |
| `/next-step-for-agents` | POST | (Legacy) Single agent step |

### Game Environment Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/register` | POST | Register new AI agent |
| `/api/agent/command` | POST | Send action to agent |
| `/api/agent/state/:id` | GET | Get agent game state |
| `/api/agent/:id` | DELETE | Remove agent |
| `/api/status` | GET | Get game server status |

## Game State Structure

The game state provided to each agent's LLM:

```json
{
  "position": {"x": 120.5, "y": 200.3},
  "health": 85,
  "max_health": 100,
  "inventory": ["pistol", "rifle"],
  "ammo": {
    "9mm": 30,
    "556mm": 60,
    "12g": 0
  },
  "nearby_agents": [
    {
      "id": "bot_002",
      "position": {"x": 140.0, "y": 210.0},
      "distance": 22.4,
      "health": 100,
      "username": "AI_bot_002"
    }
  ],
  "nearby_loot": [
    {
      "type": "shotgun",
      "position": {"x": 125.0, "y": 195.0},
      "distance": 7.8
    }
  ],
  "nearby_obstacles": [
    {
      "type": "tree",
      "position": {"x": 130.0, "y": 200.0},
      "distance": 9.5,
      "health": 100
    }
  ]
}
```

## Action Types

### Move
```json
{
  "tool_type": "move",
  "parameters": {
    "x": 15,    // Relative X movement
    "y": -10    // Relative Y movement
  }
}
```

### Attack
```json
{
  "tool_type": "attack",
  "parameters": {
    "target_player_id": "bot_002"  // Target agent ID
  }
}
```

### Collect
```json
{
  "tool_type": "collect",
  "parameters": {}  // Picks up items within 5-unit radius
}
```

### Plan
```json
{
  "tool_type": "plan",
  "parameters": {
    "plan": "Move to high ground and collect weapons"
  }
}
```

## Timing & Performance

- **Game Server:** Runs at 40 TPS (25ms per tick)
- **Backend Steps:** Configurable delay (default 1 second)
- **LLM Processing:** ~1-3 seconds per agent per step
- **Recommended Step Delay:** 1-2 seconds for 3-5 agents

## Visual Monitoring

You can watch agents in action:

```bash
# In another terminal
cd game_environment
bun dev:client
# Open http://localhost:3000
```

You'll see AI agents moving, shooting, and collecting items in real-time!

## Error Handling

The system is designed to be resilient:

- If an agent's LLM fails, it continues with other agents
- Network errors are logged but don't stop the session
- Invalid actions are logged and skipped
- Auto-stepping continues even if individual steps error

## Example: Complete Flow

```bash
# 1. Add agents
for i in {1..3}; do
  curl -X POST http://localhost:8000/add-agent \
    -H "Content-Type: application/json" \
    -d @agent_program.json
done

# 2. Start session
curl -X POST http://localhost:8000/start-game-session

# 3. Run for 100 steps
curl -X POST "http://localhost:8000/start-auto-stepping?step_delay=1.0"

# 4. Watch for a while...

# 5. Stop and cleanup
curl -X POST http://localhost:8000/stop-auto-stepping
curl -X POST http://localhost:8000/stop-game-session
```

## Next Steps

1. Tune agent prompts for better decision making
2. Adjust step delay for optimal performance
3. Add more complex block programs
4. Monitor agent performance and iterate
