#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR"

CIRCUIT_NAME="circuit"
WITNESS_NAME="$CIRCUIT_NAME"

LOG_FILE="prove.log"

# Truncate log file at start
: > "$LOG_FILE"

log() {
    printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$1" | tee -a "$LOG_FILE"
}

log "=== Generating proof for $CIRCUIT_NAME ==="

log "Step 1: Executing circuit to generate witness"
nargo execute "$WITNESS_NAME" >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "Failed to execute circuit"
    exit 1
fi

log "Step 2: Generating proof (binary format)"
bb prove \
    --scheme ultra_honk \
    --bytecode_path ./target/$CIRCUIT_NAME.json \
    --witness_path ./target/$WITNESS_NAME.gz \
    --output_path ./target \
    --oracle_hash keccak \
    >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "Failed to generate proof"
    exit 1
fi

log "Step 3: Generating proof in fields format (JSON-compatible)"
# Create a temporary directory for fields output
mkdir -p ./target/fields_output
bb prove \
    --scheme ultra_honk \
    --bytecode_path ./target/$CIRCUIT_NAME.json \
    --witness_path ./target/$WITNESS_NAME.gz \
    --output_path ./target/fields_output \
    --oracle_hash keccak \
    --output_format fields \
    >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "Failed to generate proof in fields format"
    exit 1
fi

log "Step 4: Moving fields output to target directory"
if [ -f "./target/fields_output/proof_fields.json" ]; then
    mv ./target/fields_output/proof_fields.json ./target/proof_fields.json
    log "Moved proof_fields.json to ./target/"
fi
if [ -f "./target/fields_output/public_inputs_fields.json" ]; then
    mv ./target/fields_output/public_inputs_fields.json ./target/public_inputs_fields.json
    log "Moved public_inputs_fields.json to ./target/"
fi
# Clean up temp directory
rm -rf ./target/fields_output

log "=== Proof generation complete ==="
log "Files generated:"
log "  - Binary proof: ./target/proof"
log "  - Binary public inputs: ./target/public_inputs"
log "  - Fields proof (JSON): ./target/proof_fields.json"
log "  - Fields public inputs (JSON): ./target/public_inputs_fields.json"
log ""
log "To view the proof in JSON format: cat ./target/proof_fields.json"
log "To view the public inputs in JSON format: cat ./target/public_inputs_fields.json"

