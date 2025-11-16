# Multi-stage build for minimal image size
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build is not needed since we use tsx, but we validate the setup
RUN npm list

# Production stage
FROM node:22-alpine

# Install production dependencies only
RUN apk add --no-cache \
    tini \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install production dependencies + tsx for running TypeScript
RUN npm install --omit=dev && \
    npm install tsx && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run with increased memory limit
CMD ["node", "--max-old-space-size=16384", "--no-warnings", "node_modules/.bin/tsx", "src/server.ts"]

