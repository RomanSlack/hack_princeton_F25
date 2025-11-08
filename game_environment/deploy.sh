#!/bin/bash

# Google Cloud Run Deployment Script for Game Environment
# This script automates the deployment process to Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="game-server"
REGION="us-central1"
MEMORY="1Gi"
CPU="2"
MIN_INSTANCES="0"
MAX_INSTANCES="10"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_error "Not authenticated with Google Cloud. Please run:"
    echo "  gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "No Google Cloud project configured. Please run:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_info "Deploying to project: $PROJECT_ID"
print_info "Service name: $SERVICE_NAME"
print_info "Region: $REGION"

# Prompt for confirmation
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Enable required APIs
print_info "Ensuring required APIs are enabled..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
print_success "Required APIs enabled"

# Deploy to Cloud Run
print_info "Starting deployment to Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory $MEMORY \
    --cpu $CPU \
    --min-instances $MIN_INSTANCES \
    --max-instances $MAX_INSTANCES \
    --timeout 300 \
    --set-env-vars NODE_ENV=production

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
print_success "Deployment completed successfully!"
echo ""
echo "============================================"
echo "🎮 Game Server Information"
echo "============================================"
echo "Service URL:    $SERVICE_URL"
echo "WebSocket URL:  ${SERVICE_URL/https:/wss:}/play"
echo "Status API:     $SERVICE_URL/api/status"
echo "Region:         $REGION"
echo "============================================"
echo ""
print_info "Testing server status..."

# Test the deployment
if curl -s -f "$SERVICE_URL/api/status" > /dev/null; then
    print_success "Server is responding correctly!"
    echo ""
    echo "Server Status:"
    curl -s "$SERVICE_URL/api/status" | python3 -m json.tool || curl -s "$SERVICE_URL/api/status"
else
    print_warning "Server status check failed. It may still be starting up."
    print_info "Check logs with: gcloud run services logs tail $SERVICE_NAME --region $REGION"
fi

echo ""
print_info "To view logs, run:"
echo "  gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
print_info "To update client configuration:"
echo "  VITE_SERVER_HOST=${SERVICE_URL#https://}"
echo "  VITE_USE_WSS=true"
echo ""
print_success "Deployment complete! 🚀"

