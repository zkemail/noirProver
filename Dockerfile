# Base image with GLIBC 2.39 (>= 2.38 required)
FROM ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive

# Update and install basic dependencies
RUN apt update && \
    apt install -y --no-install-recommends \
    wget \
    ca-certificates \
    curl \
    git \
    build-essential \
    gzip \
    pkg-config \
    libssl-dev \
    zip \
    unzip \
    jq \
    xz-utils \
    protobuf-compiler \
    libprotobuf-dev \
    && \
    rm -rf /var/lib/apt/lists/*

# Install Noir
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
ENV PATH="/root/.nargo/bin:$PATH"
RUN noirup --version 1.0.0-beta.5

# Install Barrentenberg
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
ENV PATH="/root/.bb:$PATH"
RUN bbup --version 0.84.0

# Install Rust
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js 22.x directly from official binary
RUN curl -fsSL https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-x64.tar.xz -o node.tar.xz && \
    tar -xf node.tar.xz -C /usr/local --strip-components=1 && \
    rm node.tar.xz && \
    npm install -g yarn snarkjs

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Install production dependencies + tsx for running TypeScript
RUN npm install --omit=dev && \
    npm install tsx && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY .cache/ .cache/

# Expose port
EXPOSE 3000

# Run with increased memory limit
CMD ["node", "--max-old-space-size=16384", "--no-warnings", "node_modules/.bin/tsx", "src/server.ts"]

