# Deploy Client to Vercel

Quick guide to deploy the game client to Vercel.

## Prerequisites

1. Get your Cloud Run server URL:
   ```bash
   gcloud run services describe game-server --region us-central1 --format 'value(status.url)'
   # Example output: https://game-server-abc123-uc.a.run.app
   ```

2. Note the hostname (without `https://`):
   ```
   game-server-abc123-uc.a.run.app
   ```

## Option 1: Vercel CLI (Recommended)

### Install Vercel CLI
```bash
npm i -g vercel
```

### Deploy
```bash
cd game_environment/client

# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

### Set Environment Variables

After first deployment, configure environment variables:

```bash
# Set game server URL
vercel env add VITE_SERVER_HOST production
# Paste your Cloud Run URL: game-server-abc123-uc.a.run.app

# Set port
vercel env add VITE_SERVER_PORT production
# Enter: 443

# Enable secure WebSocket
vercel env add VITE_USE_WSS production
# Enter: true
```

### Redeploy with Environment Variables
```bash
vercel --prod
```

## Option 2: Vercel Dashboard

### Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Set **Root Directory**: `game_environment/client`
5. Click "Deploy"

### Step 2: Configure Environment Variables

1. Go to Project Settings → Environment Variables
2. Add the following for **Production**:

| Name | Value |
|------|-------|
| `VITE_SERVER_HOST` | `game-server-abc123-uc.a.run.app` |
| `VITE_SERVER_PORT` | `443` |
| `VITE_USE_WSS` | `true` |

3. Save and redeploy

## Option 3: One-Line Deploy

```bash
cd game_environment/client
npx vercel --prod \
  -e VITE_SERVER_HOST=game-server-abc123-uc.a.run.app \
  -e VITE_SERVER_PORT=443 \
  -e VITE_USE_WSS=true
```

Replace `game-server-abc123-uc.a.run.app` with your actual Cloud Run URL.

## Verify Deployment

After deployment, Vercel will give you a URL like:
```
https://your-game-client.vercel.app
```

1. Open the URL in your browser
2. Open browser console (F12)
3. Enter a username and click "Play"
4. You should see:
   ```
   [Client] Connecting to wss://game-server-abc123-uc.a.run.app/play as player
   [Client] Connected to server
   ```

## Update Environment Variables

To change the game server URL later:

### Via CLI
```bash
vercel env rm VITE_SERVER_HOST production
vercel env add VITE_SERVER_HOST production
# Enter new URL

# Redeploy
vercel --prod
```

### Via Dashboard
1. Go to Project Settings → Environment Variables
2. Edit `VITE_SERVER_HOST`
3. Save
4. Go to Deployments → ⋯ → Redeploy

## Local Testing Before Deploy

Test with production environment variables locally:

```bash
# Create .env.production with your Cloud Run URL
cat > .env.production << 'EOF'
VITE_SERVER_HOST=game-server-abc123-uc.a.run.app
VITE_SERVER_PORT=443
VITE_USE_WSS=true
EOF

# Build and preview
bun run build
bun run preview
```

Open `http://localhost:4173` and verify it connects to your Cloud Run server.

## Troubleshooting

### "Connection Failed" Error
- Verify Cloud Run server is running:
  ```bash
  curl https://YOUR-CLOUD-RUN-URL.run.app/api/status
  ```
- Check environment variables in Vercel dashboard
- Check browser console for exact error

### Mixed Content Warning
- Ensure `VITE_USE_WSS=true` is set
- HTTPS sites (Vercel) must use WSS not WS

### Build Fails
- Ensure you set Root Directory to `game_environment/client` in Vercel
- Check that `package.json` has all dependencies
- Try building locally first: `bun run build`

### Wrong Server URL
- Double-check `VITE_SERVER_HOST` has no `https://` prefix
- Should be just: `game-server-abc123-uc.a.run.app`

## Automatic Deployments

Connect your Git repository to Vercel for automatic deployments:

1. Push code to GitHub/GitLab/Bitbucket
2. Vercel automatically deploys on every push to main branch
3. Pull requests get preview deployments

## Custom Domain

Add a custom domain in Vercel:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `mygame.com`)
3. Follow DNS configuration instructions
4. Vercel handles SSL automatically

## Cost

- Vercel Hobby plan is **free** for personal projects
- Includes:
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100 GB bandwidth/month

Perfect for game client hosting! 🎮

