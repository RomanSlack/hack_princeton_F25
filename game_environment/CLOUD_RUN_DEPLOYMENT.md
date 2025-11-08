# Google Cloud Run Deployment Guide

This guide will help you deploy the game environment to Google Cloud Run.

## Prerequisites

1. **Google Cloud CLI**: Install `gcloud` CLI tool
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable Required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

## Deployment Steps

### Option 1: Deploy Directly from Source (Recommended)

```bash
# Navigate to the game_environment directory
cd game_environment

# Deploy to Cloud Run (this will build and deploy in one step)
gcloud run deploy game-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production
```

### Option 2: Build and Deploy with Docker

```bash
# Navigate to the game_environment directory
cd game_environment

# Set your project ID and region
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
export SERVICE_NAME=game-server

# Build the Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

### Option 3: Use Artifact Registry (Alternative)

```bash
# Create an Artifact Registry repository
gcloud artifacts repositories create game-repo \
  --repository-format=docker \
  --location=us-central1

# Build and push to Artifact Registry
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/game-repo/game-server

# Deploy from Artifact Registry
gcloud run deploy game-server \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/game-repo/game-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2
```

## Configuration Options

### Memory and CPU
- **Memory**: 512Mi to 4Gi (recommended: 1Gi for moderate traffic)
- **CPU**: 1 to 4 (recommended: 2 for game server)

### Scaling
```bash
# Set minimum and maximum instances
--min-instances 0  # Scale to zero when idle (saves cost)
--max-instances 10 # Maximum concurrent instances
```

### Environment Variables
```bash
# Add custom environment variables
--set-env-vars NODE_ENV=production,PORT=8080
```

### WebSocket Support
Cloud Run supports WebSocket connections by default. No additional configuration needed.

## After Deployment

1. **Get your service URL**:
   ```bash
   gcloud run services describe game-server --region us-central1 --format 'value(status.url)'
   ```

2. **Test the deployment**:
   ```bash
   # Check server status
   curl https://YOUR-SERVICE-URL.run.app/api/status
   
   # Should return:
   # {"online":true,"players":0,"aiAgents":0,"uptime":...,"timestamp":...}
   ```

3. **Connect to WebSocket**:
   - Use: `wss://YOUR-SERVICE-URL.run.app/play`
   - Note: Cloud Run URLs use HTTPS, so WebSocket connections use WSS

4. **Update your client configuration**:
   - Set `VITE_SERVER_HOST` to your Cloud Run URL (without protocol)
   - Set `VITE_USE_WSS=true` for secure WebSocket connections

## Monitoring

```bash
# View logs
gcloud run services logs tail game-server --region us-central1

# View metrics
gcloud run services describe game-server --region us-central1
```

## Cost Optimization

- **Minimum instances**: Set to 0 to avoid charges when idle
- **Request timeout**: Set appropriate timeout (300s = 5 minutes)
- **CPU allocation**: Only allocate during request processing
  ```bash
  --cpu-throttling  # Throttle CPU when not serving requests
  ```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify `bun.lock` is up to date
- Check `.dockerignore` isn't excluding needed files

### Connection Issues
- Ensure `--allow-unauthenticated` is set for public access
- Check firewall rules in your GCP project
- Verify WebSocket endpoint: `/play`

### Performance Issues
- Increase memory: `--memory 2Gi`
- Increase CPU: `--cpu 4`
- Add minimum instances: `--min-instances 1` (prevents cold starts)

## CI/CD Integration

Add this to your GitHub Actions or CI/CD pipeline:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_CREDENTIALS }}'
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy game-server \
          --source ./game_environment \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [WebSocket on Cloud Run](https://cloud.google.com/run/docs/triggering/websockets)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)

