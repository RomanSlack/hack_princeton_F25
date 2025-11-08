# Client Environment Configuration

The client uses environment variables to configure the game server connection. This allows you to easily switch between local development and production deployments.

## Environment Variables

| Variable | Description | Local Dev | Production |
|----------|-------------|-----------|------------|
| `VITE_SERVER_HOST` | WebSocket server hostname (without protocol) | `localhost` | `your-service.run.app` |
| `VITE_SERVER_PORT` | WebSocket server port | `8000` | `443` |
| `VITE_USE_WSS` | Use secure WebSocket (wss://) | `false` | `true` |
| `VITE_BACKEND_URL` | Backend API for AI agents (optional) | `http://localhost:8001` | `https://your-backend.com` |

## Auto-Detection

If no environment variables are set, the client automatically detects the environment:
- **Local**: Uses `ws://localhost:8000/play`
- **Production**: Uses `wss://[current-hostname]:443/play`

## Setup Instructions

### For Local Development

Create a `.env.local` file in the `client` directory:

```bash
# .env.local
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
VITE_BACKEND_URL=http://localhost:8001
```

### For Vercel Deployment

When deploying to Vercel, set these environment variables in your project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:

```
VITE_SERVER_HOST = your-game-server-abc123.run.app
VITE_SERVER_PORT = 443
VITE_USE_WSS = true
```

Or use the Vercel CLI:

```bash
vercel env add VITE_SERVER_HOST
# Enter: your-game-server-abc123.run.app

vercel env add VITE_SERVER_PORT
# Enter: 443

vercel env add VITE_USE_WSS
# Enter: true
```

### For Production Build (Any Platform)

Create a `.env.production` file:

```bash
# .env.production
VITE_SERVER_HOST=your-game-server-abc123.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
```

Then build:

```bash
bun run build
# The dist/ folder is ready to deploy
```

## Quick Setup Commands

### Create Local Environment File

```bash
cat > .env.local << 'EOF'
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
VITE_BACKEND_URL=http://localhost:8001
EOF
```

### Create Production Environment File

After getting your Cloud Run URL, create `.env.production`:

```bash
# Replace YOUR_CLOUD_RUN_URL with your actual URL
cat > .env.production << 'EOF'
VITE_SERVER_HOST=YOUR_CLOUD_RUN_URL.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
EOF
```

## Testing Connection

The client will log the WebSocket URL when connecting. Check the browser console:

```
[Client] Connecting to ws://localhost:8000/play as player
```

or for production:

```
[Client] Connecting to wss://your-service.run.app/play as player
```

## Troubleshooting

### Connection Refused
- **Local**: Ensure game server is running (`cd ../server && bun run dev`)
- **Production**: Verify Cloud Run service is deployed and URL is correct

### Mixed Content Error (Blocked Loading)
- Ensure `VITE_USE_WSS=true` when deploying to HTTPS hosts (Vercel, Netlify, etc.)
- HTTPS sites must use WSS (secure WebSocket)

### Wrong Port
- Local development typically uses port 8000
- Cloud Run uses standard HTTPS port 443
- Check `VITE_SERVER_PORT` matches your server configuration

## Example Configurations

### Scenario 1: Local Client + Local Server
```bash
# .env.local
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

Run:
```bash
# Terminal 1: Start server
cd ../server && bun run dev

# Terminal 2: Start client
cd client && bun run dev
```

### Scenario 2: Local Client + Cloud Run Server
```bash
# .env.local
VITE_SERVER_HOST=game-server-abc123.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
```

Run:
```bash
cd client && bun run dev
```

### Scenario 3: Vercel Client + Cloud Run Server
Set in Vercel dashboard:
- `VITE_SERVER_HOST`: `game-server-abc123.run.app`
- `VITE_SERVER_PORT`: `443`
- `VITE_USE_WSS`: `true`

Deploy:
```bash
vercel --prod
```

## How It Works

The client uses `common/src/config.ts` which provides:

```typescript
export function getClientConfig(): ClientConfig {
    // Auto-detects environment or uses env vars
    const serverHost = import.meta.env.VITE_SERVER_HOST || 
                      (isProduction ? window.location.hostname : 'localhost');
    const serverPort = import.meta.env.VITE_SERVER_PORT ? 
                      parseInt(import.meta.env.VITE_SERVER_PORT) : 8000;
    const useSecure = import.meta.env.VITE_USE_WSS === 'true' || 
                     window.location.protocol === 'https:';
    
    return { serverAddress: serverHost, serverPort, useSecureWebSocket: useSecure };
}
```

This means the client is smart enough to:
1. Use environment variables if provided
2. Auto-detect production vs development
3. Use secure WebSocket (wss://) when served over HTTPS
4. Fall back to sensible defaults

## Get Your Cloud Run URL

After deploying the server:

```bash
gcloud run services describe game-server --region us-central1 --format 'value(status.url)'
# Output: https://game-server-abc123-uc.a.run.app
# Use just: game-server-abc123-uc.a.run.app (without https://)
```

