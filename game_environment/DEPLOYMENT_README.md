# Deployment Setup for Game Environment

This directory contains everything needed to deploy the game server to Google Cloud Run.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker build configuration |
| `.dockerignore` | Excludes unnecessary files from Docker build |
| `deploy.sh` | Automated deployment script for Cloud Run |
| `test-docker.sh` | Local Docker build and test script |
| `CLOUD_RUN_DEPLOYMENT.md` | Detailed deployment documentation |

## 🚀 Quick Start

### 1. Test Docker Build Locally

Before deploying to Cloud Run, verify your Docker build works:

```bash
./test-docker.sh
```

This will:
- Build the Docker image
- Run a container locally on port 8080
- Test the server endpoints
- Show logs and status

### 2. Deploy to Google Cloud Run

Once the local test passes, deploy to Cloud Run:

```bash
./deploy.sh
```

This will:
- Check your Google Cloud configuration
- Enable required APIs
- Build and deploy to Cloud Run
- Display your service URL and WebSocket endpoint

### Manual Deployment

If you prefer manual deployment:

```bash
gcloud run deploy game-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2
```

## 🔧 Configuration

### Server Configuration
The server automatically detects the `PORT` environment variable from Cloud Run (defaults to 8080).

See `common/src/config.ts`:
```typescript
port: parseInt(process.env.PORT || "8080")
```

### Docker Configuration

**Multi-stage build:**
1. **Stage 1**: Builds the client (Vite frontend)
2. **Stage 2**: Sets up the production server

**Image optimizations:**
- Uses `oven/bun:1-slim` for smaller production image
- Excludes dev dependencies and unnecessary files
- Uses `.dockerignore` to minimize build context

## 🌐 Endpoints

After deployment, your server will have:

| Endpoint | Type | Purpose |
|----------|------|---------|
| `/` | HTTP | Root endpoint (health check) |
| `/api/status` | HTTP GET | Server status and stats |
| `/play` | WebSocket | Game connection endpoint |
| `/api/agent/register` | HTTP POST | Register AI agent |
| `/api/agent/command` | HTTP POST | Send agent command |
| `/api/agent/state/:id` | HTTP GET | Get agent state |
| `/api/agent/:id` | HTTP DELETE | Remove agent |

## 📊 Cloud Run Configuration

Default settings:
- **Memory**: 1Gi
- **CPU**: 2
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300s (5 minutes)
- **Port**: 8080

Adjust these in `deploy.sh` or use command flags:

```bash
gcloud run deploy game-server \
  --memory 2Gi \
  --cpu 4 \
  --min-instances 1 \
  --max-instances 20
```

## 🔍 Monitoring & Debugging

### View Logs
```bash
gcloud run services logs tail game-server --region us-central1
```

### View Service Details
```bash
gcloud run services describe game-server --region us-central1
```

### Test Endpoints
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe game-server --region us-central1 --format 'value(status.url)')

# Test status
curl $SERVICE_URL/api/status

# Pretty print JSON
curl -s $SERVICE_URL/api/status | python3 -m json.tool
```

### Local Testing
```bash
# Build and run locally
docker build -t game-server-test .
docker run -p 8080:8080 game-server-test

# Test locally
curl http://localhost:8080/api/status
```

## 💰 Cost Optimization

Cloud Run pricing is based on:
1. **CPU time** (while serving requests)
2. **Memory allocation**
3. **Requests**
4. **Network egress**

**Tips to reduce costs:**
- Set `min-instances=0` (scale to zero when idle)
- Use appropriate memory/CPU (1Gi/2CPU is good for moderate traffic)
- Enable CPU throttling: `--cpu-throttling`
- Monitor usage with Cloud Monitoring

## 🐛 Troubleshooting

### Build fails with "module not found"
- Ensure all dependencies are in `package.json`
- Run `bun install` locally to update `bun.lock`
- Check `.dockerignore` isn't excluding needed files

### Container crashes on startup
- Check logs: `docker logs <container-name>`
- Verify PORT environment variable is set
- Check server binds to `0.0.0.0` not `localhost`

### WebSocket connections fail
- Cloud Run supports WebSockets by default
- Use `wss://` (not `ws://`) for Cloud Run URLs
- Check client configuration uses correct URL
- Verify `--allow-unauthenticated` is set

### Cold starts are slow
- Set `--min-instances 1` to keep at least one instance warm
- Note: This will incur charges even when idle
- Consider using Cloud Run's minimum instances feature

## 🔄 CI/CD Integration

For automated deployments, see `CLOUD_RUN_DEPLOYMENT.md` for GitHub Actions examples.

Quick example:
```yaml
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy game-server \
      --source ./game_environment \
      --region us-central1
```

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [WebSocket on Cloud Run](https://cloud.google.com/run/docs/triggering/websockets)

## 🆘 Need Help?

1. Check logs first: `gcloud run services logs tail game-server`
2. Test locally with: `./test-docker.sh`
3. Review detailed guide: `CLOUD_RUN_DEPLOYMENT.md`
4. Check Cloud Run service status in [GCP Console](https://console.cloud.google.com/run)

---

**Happy Deploying! 🚀**

