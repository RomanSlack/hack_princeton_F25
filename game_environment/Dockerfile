# Multi-stage Dockerfile for Google Cloud Run deployment
# Stage 1: Build the client (frontend)
FROM oven/bun:1 AS client-builder

WORKDIR /app

# Copy workspace configuration
COPY package.json bun.lock tsconfig.json ./
COPY common/package.json ./common/
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies for all workspaces
RUN bun install --frozen-lockfile

# Copy source code
COPY common ./common
COPY client ./client

# Build the client
WORKDIR /app/client
RUN bun run build

# Stage 2: Production server
FROM oven/bun:1-slim

WORKDIR /app

# Copy workspace configuration (need all three for workspace validation)
COPY package.json bun.lock tsconfig.json ./
COPY common/package.json ./common/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy common and server source code
COPY common ./common
COPY server ./server

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Note: Cloud Run has its own health checking mechanism
# The health check below is for local/non-Cloud Run deployments
# Install curl for health checks (optional, can be removed for Cloud Run only)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Health check endpoint (used by Docker, not Cloud Run)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/status || exit 1

# Start the server
WORKDIR /app/server
CMD ["bun", "run", "src/index.ts"]

