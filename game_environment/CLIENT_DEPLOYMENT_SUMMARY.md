# Client Deployment Summary

Your client is now fully configured to work with environment variables! 🎉

## What Was Updated

✅ **Environment Variable Support**: Client already uses `common/src/config.ts` for smart configuration
✅ **Backend URL**: Updated to use `VITE_BACKEND_URL` environment variable
✅ **Vercel Configuration**: Added `vercel.json` for smooth deployment
✅ **Documentation**: Created comprehensive setup guides

## Quick Start

### 1. Get Your Cloud Run URL

```bash
gcloud run services describe game-server --region us-central1 --format 'value(status.url)'
# Output: https://game-server-abc123-uc.a.run.app
# Use: game-server-abc123-uc.a.run.app (without https://)
```

### 2. Deploy to Vercel

```bash
cd game_environment/client

# One-line deploy (replace URL with yours)
npx vercel --prod \
  -e VITE_SERVER_HOST=game-server-abc123-uc.a.run.app \
  -e VITE_SERVER_PORT=443 \
  -e VITE_USE_WSS=true
```

That's it! Your game is live! 🚀

## Configuration Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment configuration |
| `ENV_SETUP.md` | Detailed environment variable guide |
| `VERCEL_DEPLOY.md` | Step-by-step Vercel deployment |

## Environment Variables

The client uses these variables to connect to your game server:

```bash
VITE_SERVER_HOST=game-server-abc123-uc.a.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
VITE_BACKEND_URL=https://your-backend.com  # Optional
```

## Local Development

Create a `.env.local` file:

```bash
cd game_environment/client

cat > .env.local << 'EOF'
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
VITE_BACKEND_URL=http://localhost:8001
EOF

bun run dev
```

## Architecture

```
┌─────────────────────┐
│   Vercel (Client)   │  ← Users connect here
│  Static Hosting     │
└──────────┬──────────┘
           │ WSS (WebSocket Secure)
           ↓
┌─────────────────────┐
│ Cloud Run (Server)  │  ← Game logic runs here
│  Docker Container   │
└─────────────────────┘
```

## URLs After Deployment

- **Client**: `https://your-game-client.vercel.app`
- **Server**: `https://game-server-abc123-uc.a.run.app`
- **WebSocket**: `wss://game-server-abc123-uc.a.run.app/play`

## Testing

1. Open your Vercel URL in browser
2. Open browser console (F12)
3. Enter username and click "Play"
4. Look for:
   ```
   [Client] Connecting to wss://game-server-abc123-uc.a.run.app/play
   [Client] Connected to server
   ```

## Auto-Detection Features

The client is smart! It automatically:
- ✅ Detects localhost vs production
- ✅ Uses WSS when served over HTTPS
- ✅ Falls back to sensible defaults
- ✅ Logs connection info to console

## Cost

- **Vercel**: Free (Hobby plan)
- **Cloud Run**: Pay-per-use (scales to zero when idle)

## Support

See detailed guides:
- 📖 [ENV_SETUP.md](client/ENV_SETUP.md) - Environment configuration
- 📖 [VERCEL_DEPLOY.md](client/VERCEL_DEPLOY.md) - Deployment guide
- 📖 [CLOUD_RUN_DEPLOYMENT.md](CLOUD_RUN_DEPLOYMENT.md) - Server deployment

---

**You're all set!** Deploy your client to Vercel and start playing! 🎮

