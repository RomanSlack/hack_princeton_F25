#!/bin/bash

# Local Docker Build and Test Script
# Use this to test your Docker build locally before deploying to Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="game-server-test"
CONTAINER_NAME="game-server-test-container"
PORT=8080

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

# Clean up any existing container
print_info "Cleaning up existing containers..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Build the Docker image
print_info "Building Docker image..."
echo ""

if docker build -t $IMAGE_NAME .; then
    print_success "Docker image built successfully!"
else
    print_error "Docker build failed!"
    exit 1
fi

# Get image size
IMAGE_SIZE=$(docker images $IMAGE_NAME --format "{{.Size}}")
print_info "Image size: $IMAGE_SIZE"

# Run the container
print_info "Starting container on port $PORT..."
echo ""

docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:8080 \
    -e NODE_ENV=production \
    -e PORT=8080 \
    $IMAGE_NAME

print_success "Container started!"

# Wait for server to be ready
print_info "Waiting for server to be ready..."
sleep 3

# Check if container is still running
if ! docker ps | grep -q $CONTAINER_NAME; then
    print_error "Container failed to start!"
    print_info "Showing container logs:"
    docker logs $CONTAINER_NAME
    docker rm -f $CONTAINER_NAME
    exit 1
fi

# Test the server
print_info "Testing server endpoints..."
echo ""

# Test root endpoint
if curl -s -f "http://localhost:$PORT/" > /dev/null; then
    print_success "✓ Root endpoint responding"
else
    print_warning "✗ Root endpoint not responding"
fi

# Test status API
if STATUS=$(curl -s -f "http://localhost:$PORT/api/status"); then
    print_success "✓ Status API responding"
    echo "  Server Status:"
    echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"
else
    print_warning "✗ Status API not responding"
fi

echo ""
print_success "Container is running successfully!"
echo ""
echo "============================================"
echo "🎮 Local Test Server Information"
echo "============================================"
echo "Container:      $CONTAINER_NAME"
echo "Image:          $IMAGE_NAME"
echo "Port:           $PORT"
echo "Status API:     http://localhost:$PORT/api/status"
echo "WebSocket:      ws://localhost:$PORT/play"
echo "============================================"
echo ""
print_info "Useful commands:"
echo "  View logs:     docker logs -f $CONTAINER_NAME"
echo "  Stop server:   docker stop $CONTAINER_NAME"
echo "  Remove:        docker rm -f $CONTAINER_NAME"
echo "  Exec shell:    docker exec -it $CONTAINER_NAME /bin/sh"
echo ""

read -p "Keep container running? (Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_info "Stopping and removing container..."
    docker rm -f $CONTAINER_NAME
    print_success "Container removed"
else
    print_success "Container is still running. Stop it when done with: docker stop $CONTAINER_NAME"
fi

