# Frontend Environment Configuration Guide

This guide explains how to configure the frontend Next.js application using environment variables.

## Quick Setup

### Local Development

1. Copy the example file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. The default values work for local development:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
   NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

### Production (Vercel)

Set environment variables in Vercel dashboard or CLI:

```bash
vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter: https://backend-server-xyz456.run.app

vercel env add NEXT_PUBLIC_GAME_CLIENT_URL production
# Enter: https://game-client.vercel.app
```

## Environment Variables

### 🔌 Backend API Configuration

#### `NEXT_PUBLIC_BACKEND_URL`
- **Default**: `http://localhost:8001`
- **Description**: URL of the FastAPI backend server
- **Used for**: 
  - Agent deployment (`/add-agent`)
  - Agent state monitoring (`/agents-state`)
  - Chat functionality (`/chat`)
  - Game session management

**Examples:**
```bash
# Local development
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001

# Cloud Run backend
NEXT_PUBLIC_BACKEND_URL=https://backend-server-xyz456-uc.a.run.app

# Custom domain
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

### 🎮 Game Client Configuration

#### `NEXT_PUBLIC_GAME_CLIENT_URL`
- **Default**: `http://localhost:3000`
- **Description**: URL of the game environment client (Vite app)
- **Used for**: 
  - Embedded game iframe in builder and lessons
  - "Open in new tab" links

**Examples:**
```bash
# Local development (Vite default port)
NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000

# Vercel deployment
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client.vercel.app

# Netlify deployment
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client.netlify.app

# Custom domain
NEXT_PUBLIC_GAME_CLIENT_URL=https://play.yourdomain.com
```

## Configuration Scenarios

### Scenario 1: Full Local Development

Everything running locally:

```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000
```

**Start services:**
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Game server
cd game_environment/server && bun run dev

# Terminal 3: Game client
cd game_environment/client && bun run dev

# Terminal 4: Frontend
cd frontend && npm run dev
```

**Access:** http://localhost:3001 (or whatever Next.js shows)

### Scenario 2: Local Frontend + Production Services

Frontend running locally, everything else in cloud:

```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=https://backend-server.run.app
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client.vercel.app
```

**Start:**
```bash
cd frontend && npm run dev
```

**Access:** http://localhost:3001

### Scenario 3: Full Production

All services deployed:

```env
# Vercel environment variables
NEXT_PUBLIC_BACKEND_URL=https://backend-server-xyz456.run.app
NEXT_PUBLIC_GAME_CLIENT_URL=https://game-client-abc123.vercel.app
```

**Access:** https://your-frontend.vercel.app

## Setting Environment Variables

### For Local Development (.env.local)

Create `.env.local` in the `frontend` directory:

```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_GAME_CLIENT_URL=http://localhost:3000
EOF
```

### For Vercel Deployment

**Option 1: Vercel Dashboard**
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable for Production, Preview, and Development environments

**Option 2: Vercel CLI**
```bash
# Set for production
vercel env add NEXT_PUBLIC_BACKEND_URL production
vercel env add NEXT_PUBLIC_GAME_CLIENT_URL production

# Set for preview (optional)
vercel env add NEXT_PUBLIC_BACKEND_URL preview
vercel env add NEXT_PUBLIC_GAME_CLIENT_URL preview
```

**Option 3: Deploy with inline env vars**
```bash
vercel --prod \
  -e NEXT_PUBLIC_BACKEND_URL=https://backend.run.app \
  -e NEXT_PUBLIC_GAME_CLIENT_URL=https://game.vercel.app
```

### For Other Platforms

**Netlify:**
- Add to `netlify.toml` or Netlify dashboard

**GitHub Pages / Static Export:**
- Set in `.env.production` before building
- Run `npm run build` to generate static files

## Important Notes

### The `NEXT_PUBLIC_` Prefix

⚠️ **All client-side environment variables in Next.js must start with `NEXT_PUBLIC_`**

- This makes them available in the browser
- Without this prefix, variables are only available server-side
- Since our app uses these URLs in client components, the prefix is required

**Example:**
```bash
# ✅ Works - available in browser
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001

# ❌ Doesn't work - only server-side
BACKEND_URL=http://localhost:8001
```

### Environment Variable Loading

Next.js loads environment variables in this order (highest priority first):

1. `.env.local` (local overrides, gitignored)
2. `.env.production` or `.env.development` (environment-specific)
3. `.env` (defaults)

For production builds: `.env.production` > `.env`

### Rebuild Required

⚠️ **Important:** Environment variables are embedded at build time!

If you change environment variables:
```bash
# Local development: Next.js auto-reloads
# Just save the .env.local file

# Production/Vercel: Must redeploy
vercel --prod
```

## Verifying Configuration

### Check Environment Variables

Add this to any page during development to see loaded values:

```jsx
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('Game Client URL:', process.env.NEXT_PUBLIC_GAME_CLIENT_URL);
```

### Test Backend Connection

```bash
# Your frontend should be able to reach:
curl $NEXT_PUBLIC_BACKEND_URL/
# Expected: {"status":"healthy",...}
```

### Test Game Client

Open `$NEXT_PUBLIC_GAME_CLIENT_URL` in browser - you should see the game.

## Troubleshooting

### "Failed to fetch" errors when deploying agents

**Problem:** Frontend can't reach backend

**Solutions:**
- Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Verify backend is deployed and accessible
- Test: `curl https://YOUR-BACKEND-URL/`
- Check CORS settings in backend

### Game iframe shows blank/error

**Problem:** Game client URL is wrong or inaccessible

**Solutions:**
- Check `NEXT_PUBLIC_GAME_CLIENT_URL` is set correctly
- Verify game client is deployed
- Open the URL directly in browser to test
- Check for HTTPS/HTTP mixed content issues

### Environment variables not updating

**Problem:** Changes don't take effect

**Solutions:**
- **Local:** Restart dev server (`npm run dev`)
- **Vercel:** Redeploy after changing env vars
- Check you're editing the right file (`.env.local` not `.env.example`)
- Clear Next.js cache: `rm -rf .next`

### Mixed content warnings

**Problem:** HTTPS site loading HTTP resources

**Solutions:**
- Ensure all URLs use HTTPS in production
- Example: `https://backend.run.app` not `http://`
- Game client must also use HTTPS if frontend is HTTPS

## Default Behavior (No .env file)

If no environment variables are set, the code uses these defaults:

```javascript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const GAME_CLIENT_URL = process.env.NEXT_PUBLIC_GAME_CLIENT_URL || 'http://localhost:3000';
```

This means the app will work locally without any configuration!

## Security Best Practices

✅ **Safe to expose (NEXT_PUBLIC_ vars):**
- Backend API URLs
- Game client URLs
- Any URLs users could discover anyway

❌ **Never expose:**
- API keys
- Database credentials
- Secret tokens

For sensitive data, use:
- Environment variables WITHOUT `NEXT_PUBLIC_` prefix
- Next.js API routes (server-side)
- External secret management

## Related Documentation

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Backend ENV_CONFIG.md](../backend/ENV_CONFIG.md)
- [Game Client ENV_SETUP.md](../game_environment/client/ENV_SETUP.md)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

