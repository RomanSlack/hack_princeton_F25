# Complete Environment Configuration Guide

This guide covers environment variable setup for all components of the project.

## 📦 Project Structure

```
hack_princeton_F25/
├── backend/                  # FastAPI backend (Python)
├── frontend/                 # Next.js frontend (React)
└── game_environment/
    ├── server/              # Game server (Bun/TypeScript)
    └── client/              # Game client (Vite/TypeScript)
```

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env

# Edit .env and add your API keys:
# - DEDALUS_API_KEY or OPENAI_API_KEY
# - Other values can use defaults

python main.py
```

**Runs on:** http://localhost:8001

### 2. Game Server Setup

```bash
cd game_environment/server
bun run dev
```

**Runs on:** http://localhost:8000

### 3. Game Client Setup

```bash
cd game_environment/client
cp .env.example .env.local  # Optional, defaults work

bun run dev
```

**Runs on:** http://localhost:3000

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env.local  # Optional, defaults work

npm run dev
```

**Runs on:** http://localhost:3001

## 📋 Environment Variables Overview

| Component | Variable | Default | Production Example |
|-----------|----------|---------|-------------------|
| **Backend** | `GAME_SERVER_URL` | `http://localhost:8000` | `https://game-server-xxx.run.app` |
| **Backend** | `BACKEND_URL` | `http://localhost:8001` | `https://backend-xxx.run.app` |
| **Backend** | `DEDALUS_API_KEY` | *(required)* | `sk-daedalus-xxxxx` |
| **Backend** | `OPENAI_API_KEY` | *(required for chat)* | `sk-proj-xxxxx` |
| **Frontend** | `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8001` | `https://backend-xxx.run.app` |
| **Frontend** | `NEXT_PUBLIC_GAME_CLIENT_URL` | `http://localhost:3000` | `https://game-client.vercel.app` |
| **Game Client** | `VITE_SERVER_HOST` | `localhost` | `game-server-xxx.run.app` |
| **Game Client** | `VITE_SERVER_PORT` | `8000` | `443` |
| **Game Client** | `VITE_USE_WSS` | `false` | `true` |

## 🔗 Connection Architecture

```
User Browser
    ↓
Frontend (Next.js) ←→ Backend (FastAPI) ←→ Game Server
    ↓                                            ↑
Game Client (iframe) ←──────────────────────────┘
    (WebSocket)
```

## 📝 Configuration by Deployment Scenario

### Scenario 1: Full Local Development

All services running on localhost.

**Backend (.env):**
```env
GAME_SERVER_URL=http://localhost:8000
BACKEND_URL=http://localhost:8001
DEDALUS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
LLM_PROVIDER=daedalus
STEP_DELAY=6.0
LLM_TIMEOUT=5.0
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000
```

**Game Client (.env.local):**
```env
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

### Scenario 2: Full Production (All Cloud)

Everything deployed to cloud services.

**Backend (.env or Cloud Run secrets):**
```env
GAME_SERVER_URL=https://game-server-abc123-uc.a.run.app
BACKEND_URL=https://backend-xyz456-uc.a.run.app
DEDALUS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
LLM_PROVIDER=daedalus
STEP_DELAY=4.0
LLM_TIMEOUT=3.0
```

**Frontend (Vercel environment variables):**
```env
NEXT_PUBLIC_BACKEND_URL=https://backend-xyz456-uc.a.run.app
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client.vercel.app
```

**Game Client (Vercel environment variables):**
```env
VITE_SERVER_HOST=game-server-abc123-uc.a.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
```

### Scenario 3: Hybrid (Local Backend + Cloud Game)

Useful for backend development without deploying.

**Backend (.env):**
```env
GAME_SERVER_URL=https://game-server-abc123-uc.a.run.app
BACKEND_URL=http://localhost:8001
DEDALUS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client.vercel.app
```

## 🛠️ Setup Instructions by Component

### Backend

1. **Create environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add required API keys:**
   - Get Daedalus key: https://daedalus-labs.com
   - Get OpenAI key: https://platform.openai.com/api-keys

3. **Configure URLs:**
   ```env
   GAME_SERVER_URL=http://localhost:8000  # or your Cloud Run URL
   ```

4. **Start server:**
   ```bash
   python main.py
   ```

**Documentation:** [backend/ENV_CONFIG.md](backend/ENV_CONFIG.md)

### Frontend

1. **Create environment file (optional):**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Configure if needed:**
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
   NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

**Documentation:** [frontend/ENV_CONFIG.md](frontend/ENV_CONFIG.md)

### Game Client

1. **Create environment file (optional):**
   ```bash
   cd game_environment/client
   # Defaults work for local development
   ```

2. **For production deployment:**
   ```bash
   # Set in Vercel or create .env.production
   VITE_SERVER_HOST=game-server-abc123.run.app
   VITE_SERVER_PORT=443
   VITE_USE_WSS=true
   ```

3. **Start development server:**
   ```bash
   bun run dev
   ```

**Documentation:** [game_environment/client/ENV_SETUP.md](game_environment/client/ENV_SETUP.md)

## 🚢 Production Deployment

### 1. Deploy Game Server to Cloud Run

```bash
cd game_environment
./deploy.sh
```

Note your service URL: `https://game-server-abc123-uc.a.run.app`

### 2. Deploy Game Client to Vercel

```bash
cd game_environment/client

vercel --prod \
  -e VITE_SERVER_HOST=game-server-abc123-uc.a.run.app \
  -e VITE_SERVER_PORT=443 \
  -e VITE_USE_WSS=true
```

Note your URL: `https://game-client-xyz.vercel.app`

### 3. Deploy Backend to Cloud Run (Optional)

```bash
cd backend
# Create Dockerfile and deploy similar to game server
# Or run on your own server
```

### 4. Deploy Frontend to Vercel

```bash
cd frontend

vercel --prod \
  -e NEXT_PUBLIC_BACKEND_URL=https://backend-xyz.run.app \
  -e NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client-xyz.vercel.app
```

## ✅ Testing Your Configuration

### Test Backend

```bash
curl http://localhost:8001/
# Expected: {"status":"healthy","service":"agents-backend","agents_count":0}
```

### Test Game Server

```bash
curl http://localhost:8000/api/status
# Expected: {"online":true,"players":0,...}
```

### Test Game Client

Open http://localhost:3000 in browser - should see game.

### Test Frontend

Open http://localhost:3001 in browser - should see builder interface.

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check `NEXT_PUBLIC_BACKEND_URL` in frontend
- Verify backend is running: `curl $BACKEND_URL/`
- Check CORS settings in backend

### "Cannot connect to game server"
- Check `GAME_SERVER_URL` in backend
- Check `VITE_SERVER_HOST` in game client
- Verify game server is running: `curl $GAME_SERVER_URL/api/status`

### "WebSocket connection failed"
- Use `ws://` for local (HTTP)
- Use `wss://` for production (HTTPS)
- Check `VITE_USE_WSS` setting
- Verify port is correct (8000 local, 443 production)

### "LLM provider error"
- Check `DEDALUS_API_KEY` or `OPENAI_API_KEY` is set
- Verify key is valid
- Check `LLM_PROVIDER` setting

### "Environment variables not loading"
- **Backend:** Restart Python server
- **Frontend:** Restart Next.js (`npm run dev`)
- **Game Client:** Restart Vite (`bun run dev`)
- **Vercel:** Redeploy after changing env vars

## 📚 Detailed Documentation

Each component has detailed documentation:

| Component | Documentation |
|-----------|--------------|
| Backend | [backend/ENV_CONFIG.md](backend/ENV_CONFIG.md) |
| Frontend | [frontend/ENV_CONFIG.md](frontend/ENV_CONFIG.md) |
| Game Client | [game_environment/client/ENV_SETUP.md](game_environment/client/ENV_SETUP.md) |
| Game Server | [game_environment/CLOUD_RUN_DEPLOYMENT.md](game_environment/CLOUD_RUN_DEPLOYMENT.md) |
| Client Deploy | [game_environment/client/VERCEL_DEPLOY.md](game_environment/client/VERCEL_DEPLOY.md) |

## 🔒 Security Notes

### Safe to Expose
- Service URLs (users can discover these anyway)
- Public API endpoints
- WebSocket URLs

### Keep Secret
- `DEDALUS_API_KEY`
- `OPENAI_API_KEY`
- Database credentials (if any)
- Any other API keys

### Best Practices
- Never commit `.env` files to git
- Use secret management for production (Cloud Run secrets, Vercel env vars)
- Rotate API keys regularly
- Use different keys for development and production

## 🎯 Summary

**For Local Development:**
1. Copy `.env.example` files to `.env` or `.env.local`
2. Add your API keys (DEDALUS_API_KEY, OPENAI_API_KEY)
3. Start all services
4. Everything should work with default URLs

**For Production:**
1. Deploy game server → note URL
2. Deploy game client with server URL → note URL
3. Deploy backend with game server URL
4. Deploy frontend with backend & game client URLs
5. All services connected!

---

**Questions?** Check the component-specific documentation or open an issue.

