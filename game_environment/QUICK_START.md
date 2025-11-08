# 🚀 Quick Start Guide

Complete deployment in 3 steps!

## Step 1: Deploy Server to Cloud Run ☁️

```bash
cd game_environment
./deploy.sh
```

**Get your server URL:**
```bash
gcloud run services describe game-server --region us-central1 --format 'value(status.url)'
# Example: https://game-server-abc123-uc.a.run.app
```

## Step 2: Deploy Client to Vercel 🌐

```bash
cd client

# Replace with YOUR Cloud Run URL (without https://)
npx vercel --prod \
  -e VITE_SERVER_HOST=game-server-abc123-uc.a.run.app \
  -e VITE_SERVER_PORT=443 \
  -e VITE_USE_WSS=true
```

## Step 3: Play! 🎮

Open your Vercel URL and start playing!

---

## Local Development

**Terminal 1 - Server:**
```bash
cd game_environment/server
bun run dev
```

**Terminal 2 - Client:**
```bash
cd game_environment/client

# Create local config
cat > .env.local << 'EOF'
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
EOF

bun run dev
```

**Open:** http://localhost:3000

---

## Configuration Cheat Sheet

### Local Development
```bash
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

### Production (Vercel → Cloud Run)
```bash
VITE_SERVER_HOST=your-server.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
```

---

## Useful Commands

```bash
# View server logs
gcloud run services logs tail game-server --region us-central1

# Test server status
curl https://YOUR-SERVER.run.app/api/status

# Update Vercel env vars
vercel env ls
vercel env add VITE_SERVER_HOST production

# Rebuild client
cd client && bun run build

# Test production build locally
bun run preview
```

---

## Architecture

```
User Browser
    ↓
Vercel (Client - Static Files)
    ↓ WSS
Cloud Run (Server - Game Logic)
```

---

## Troubleshooting

**"Connection Failed"**
- Check server is running: `curl https://YOUR-SERVER.run.app/api/status`
- Verify environment variables in Vercel
- Check browser console for errors

**"Mixed Content" Error**
- Set `VITE_USE_WSS=true` in Vercel

**Wrong server URL**
- No `https://` prefix in `VITE_SERVER_HOST`
- Should be: `game-server-abc123.run.app`

---

## 📚 Full Documentation

- [Dockerfile](Dockerfile) - Server container config
- [CLOUD_RUN_DEPLOYMENT.md](CLOUD_RUN_DEPLOYMENT.md) - Server deployment guide
- [VERCEL_DEPLOY.md](client/VERCEL_DEPLOY.md) - Client deployment guide
- [ENV_SETUP.md](client/ENV_SETUP.md) - Environment variables guide

---

**That's it! You're all set! 🎉**

