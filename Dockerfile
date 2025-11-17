# Multi-stage build for minimal image size
FROM node:22-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

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
FROM node:22-slim

# Install production dependencies only
RUN apt-get update && apt-get install -y \
    tini \
    bash \
    curl \
    git \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install noir and nargo
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash; \
    /root/.nargo/bin/noirup --version v1.0.0-beta.5 && \
    mv ~/.nargo /usr/local/ && \
    cd /usr/local/.nargo/bin && \
    for binary in *; do \
        ln -sf /usr/local/.nargo/bin/$binary /usr/local/bin/$binary; \
    done && \
    cd /

# Install bb (barretenberg)  
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash; \
    chmod +x ~/.bb/bbup && \
    (~/.bb/bbup || echo "bbup completed with warnings") && \
    if [ -d ~/.bb/bin ]; then \
        mv ~/.bb /usr/local/ && \
        cd /usr/local/.bb/bin && \
        for binary in *; do \
            ln -sf /usr/local/.bb/bin/$binary /usr/local/bin/$binary; \
        done && \
        cd /; \
    else \
        echo "Warning: bb not installed"; \
    fi

# Add noir and bb binaries to PATH
ENV PATH="/usr/local/.nargo/bin:/usr/local/.bb/bin:${PATH}"

# Verify installations  
RUN echo "Checking installed binaries..." && \
    ls -la /usr/local/bin/ | grep -E "(nargo|bb)" || echo "Binaries not found in /usr/local/bin" && \
    (which nargo || echo "nargo not in PATH") && \
    (which bb || echo "bb not in PATH")

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
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Run with increased memory limit
CMD ["node", "--max-old-space-size=16384", "--no-warnings", "node_modules/.bin/tsx", "src/server.ts"]

