# Backend Environment Configuration Guide

This guide explains all environment variables used by the backend FastAPI server.

## Quick Setup

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys

3. Start the backend:
   ```bash
   python main.py
   ```

## Environment Variables

### 🤖 LLM Configuration

#### `LLM_PROVIDER`
- **Default**: `daedalus`
- **Options**: `daedalus` or `openai`
- **Description**: Which LLM provider to use for agent decisions
  - `daedalus`: Supports MCP servers (plan, search tools)
  - `openai`: Faster, direct API calls, no MCP support

**Example:**
```bash
LLM_PROVIDER=daedalus
```

#### `DEDALUS_API_KEY`
- **Required if**: `LLM_PROVIDER=daedalus`
- **Get Key**: https://daedalus-labs.com
- **Description**: API key for Daedalus Labs service

**Example:**
```bash
DEDALUS_API_KEY=sk-daedalus-xxxxxxxxxxxx
```

#### `OPENAI_API_KEY`
- **Required if**: `LLM_PROVIDER=openai` OR using chat functionality
- **Get Key**: https://platform.openai.com/api-keys
- **Description**: OpenAI API key for GPT models and chat

**Example:**
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

### 🎮 Game Server Configuration

#### `GAME_SERVER_URL`
- **Default**: `http://localhost:8000`
- **Description**: URL of the game environment server
- **Local**: `http://localhost:8000`
- **Production**: `https://game-server-abc123.run.app`

**Example:**
```bash
# Local development
GAME_SERVER_URL=http://localhost:8000

# Cloud Run production
GAME_SERVER_URL=https://game-server-abc123-uc.a.run.app
```

#### `BACKEND_URL`
- **Default**: `http://localhost:8001`
- **Description**: URL of this backend server (used by test scripts)
- **Local**: `http://localhost:8001`
- **Production**: `https://your-backend.com`

**Example:**
```bash
# Local development
BACKEND_URL=http://localhost:8001

# Production
BACKEND_URL=https://backend-server-xyz456.run.app
```

### ⚙️ Agent Behavior Configuration

#### `STEP_DELAY`
- **Default**: `6.0`
- **Unit**: Seconds
- **Description**: Minimum time between automatic game steps
- **Recommendation**: 
  - 4-6 seconds for production (balances speed and LLM processing)
  - 10+ seconds for debugging/development
  - 2-3 seconds for fast demos (may skip turns if LLM is slow)

**Example:**
```bash
STEP_DELAY=6.0
```

#### `LLM_TIMEOUT`
- **Default**: `5.0`
- **Unit**: Seconds
- **Description**: Maximum time to wait for LLM response per agent
- **Behavior**: If agent doesn't respond in time, it skips its turn
- **Recommendation**:
  - 3-5 seconds for production
  - 10+ seconds if using complex prompts or slow models

**Example:**
```bash
LLM_TIMEOUT=5.0
```

## Configuration Examples

### Local Development

```bash
# .env for local development
LLM_PROVIDER=daedalus
DEDALUS_API_KEY=sk-daedalus-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
GAME_SERVER_URL=http://localhost:8000
BACKEND_URL=http://localhost:8001
STEP_DELAY=6.0
LLM_TIMEOUT=5.0
```

### Production (Both Services on Cloud Run)

```bash
# .env for production
LLM_PROVIDER=daedalus
DEDALUS_API_KEY=sk-daedalus-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
GAME_SERVER_URL=https://game-server-abc123-uc.a.run.app
BACKEND_URL=https://backend-server-xyz456-uc.a.run.app
STEP_DELAY=4.0
LLM_TIMEOUT=3.0
```

### Hybrid (Local Backend + Cloud Run Game Server)

Useful for testing backend changes without deploying:

```bash
# .env for hybrid setup
LLM_PROVIDER=daedalus
DEDALUS_API_KEY=sk-daedalus-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
GAME_SERVER_URL=https://game-server-abc123-uc.a.run.app
BACKEND_URL=http://localhost:8001
STEP_DELAY=6.0
LLM_TIMEOUT=5.0
```

## Verifying Configuration

After setting up your `.env` file, test the configuration:

```bash
# Start the backend
python main.py

# In another terminal, check health
curl http://localhost:8001/

# Expected response:
# {"status":"healthy","service":"agents-backend","agents_count":0}
```

You should see log output indicating:
```
🚀 Using LLM provider: daedalus
🎮 Game server URL: http://localhost:8000
```

## Troubleshooting

### Error: "DEDALUS_API_KEY not found"
- Make sure `DEDALUS_API_KEY` is set in your `.env` file
- Or switch to OpenAI provider: `LLM_PROVIDER=openai`

### Error: "Failed to connect to game server"
- Check `GAME_SERVER_URL` is correct
- Ensure game server is running
- Test: `curl http://localhost:8000/api/status`

### Error: "Chat functionality is not available"
- Set `OPENAI_API_KEY` in your `.env` file
- Chat requires OpenAI even if using Daedalus for agents

### Agents timing out frequently
- Increase `LLM_TIMEOUT` (e.g., `LLM_TIMEOUT=10.0`)
- Increase `STEP_DELAY` to give more time between steps
- Check your LLM provider's performance

### Agents running too slowly
- Decrease `STEP_DELAY` (minimum ~2 seconds recommended)
- Switch to OpenAI provider for faster responses
- Simplify agent prompts

## Security Notes

⚠️ **Never commit your `.env` file to git!**

The `.env` file is already in `.gitignore`, but double-check:

```bash
# Verify .env is ignored
git status

# .env should NOT appear in the list
```

For production deployment:
- Use secret management (Cloud Run secrets, AWS Secrets Manager, etc.)
- Rotate API keys regularly
- Use read-only API keys where possible

## Environment Variables Priority

The application loads environment variables in this order:

1. **System environment variables** (highest priority)
2. **`.env` file** in the backend directory
3. **Default values** in the code (lowest priority)

This means you can override `.env` values with system env vars:

```bash
# Override just one variable
GAME_SERVER_URL=https://staging-server.run.app python main.py

# Override multiple variables
LLM_PROVIDER=openai STEP_DELAY=3.0 python main.py
```

## Related Documentation

- [Main README](README.md) - Backend overview
- [Game Integration](GAME_INTEGRATION.md) - How backend connects to game
- [Requirements](requirements.txt) - Python dependencies

