// Polyfill for browser globals expected by @zk-email/sdk
if (typeof (globalThis as any).self === "undefined") {
  (globalThis as any).self = globalThis;
}

// Polyfill Web Workers for Node.js
if (typeof (globalThis as any).Worker === "undefined") {
  const { default: Worker } = await import("web-worker");
  (globalThis as any).Worker = Worker;
}

// Polyfill IndexedDB for Node.js
if (typeof (globalThis as any).indexedDB === "undefined") {
  const { default: indexedDB } = await import("fake-indexeddb");
  (globalThis as any).indexedDB = indexedDB;
}

import express, { text } from "express";
import type { Request, Response } from "express";
import { InputsGenerator } from "./InputsGenerator";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { promisify } from "util";
import { exec } from "child_process";
import TOML from "@iarna/toml";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);
const app = express();
const port = 3000;

// Circuit cache directory
const CIRCUITS_DIR = path.join(process.cwd(), ".cache", "circuits");

// Middleware to parse JSON request bodies with increased limits
app.use(express.json({ limit: "50mb" }));

// Increase timeouts for long-running ZK proof operations
app.use((req, res, next) => {
  // Set timeout to 2 hours (7200000 ms) to match load balancer
  req.setTimeout(7200000);
  res.setTimeout(7200000);
  next();
});

// Ensure circuits directory exists
function ensureCircuitsDir() {
  if (!fs.existsSync(CIRCUITS_DIR)) {
    fs.mkdirSync(CIRCUITS_DIR, { recursive: true });
    console.log(`Created circuits directory: ${CIRCUITS_DIR}`);
  }
}

// Download file from URL
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          if (response.headers.location) {
            downloadFile(response.headers.location, destPath)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

async function prepareCircuit(blueprint: any): Promise<string> {
  // Download and extract circuit
  const downloadUrl = await blueprint.getNoirCircuitDownloadLink();
  const blueprintId = blueprint.props.id;

  if (!blueprintId) {
    throw new Error("Blueprint ID is required");
  }

  ensureCircuitsDir();

  const circuitDir = path.join(CIRCUITS_DIR, blueprintId);
  const zipPath = path.join(CIRCUITS_DIR, `${blueprintId}.zip`);

  // Check if circuit already exists and is compiled
  const compiledMarker = path.join(circuitDir, ".compiled");
  if (fs.existsSync(circuitDir) && fs.existsSync(compiledMarker)) {
    console.log(`Circuit already compiled for blueprint: ${blueprintId}`);
    return circuitDir;
  }

  // Download and extract if not exists
  if (!fs.existsSync(circuitDir)) {
    console.log(`Downloading circuit from: ${downloadUrl}`);
    await downloadFile(downloadUrl, zipPath);
    console.log(`Downloaded circuit to: ${zipPath}`);

    // Extract the zip file
    console.log(`Extracting circuit to: ${circuitDir}`);
    await execAsync(`unzip -q "${zipPath}" -d "${circuitDir}"`);
    console.log(`Circuit extracted successfully`);

    // Clean up zip file
    fs.unlinkSync(zipPath);
    console.log(`Cleaned up zip file`);
  }

  // Rename circuit in Nargo.toml to "circuit" for consistency
  const nargoTomlPath = path.join(circuitDir, "Nargo.toml");
  if (fs.existsSync(nargoTomlPath)) {
    let nargoToml = fs.readFileSync(nargoTomlPath, "utf-8");
    nargoToml = nargoToml.replace(/^name\s*=\s*".*"$/m, 'name = "circuit"');
    fs.writeFileSync(nargoTomlPath, nargoToml, "utf-8");
    console.log("Updated Nargo.toml circuit name to 'circuit'");
  }

  console.log("Running compile");
  await execAsync(`cd "${circuitDir}" && nargo compile`);

  // Create marker file to indicate successful compilation
  fs.writeFileSync(compiledMarker, new Date().toISOString(), "utf-8");
  console.log("Circuit compiled and marked successfully");

  return circuitDir;
}

export const getProof = async (
  rawEmail: string,
  blueprintSlug: string,
  command: string
) => {
  const startTime = Date.now();
  const { default: initZkEmail } = await import("@zk-email/sdk");
  const { initNoirWasm } = await import("@zk-email/sdk/initNoirWasm");

  const sdk = initZkEmail({
    baseUrl: "https://dev-conductor.zk.email",
    logging: { enabled: true, level: "debug" },
  });

  const blueprint = await sdk.getBlueprint(blueprintSlug);

  const circuitPath = await prepareCircuit(blueprint);
  console.log(`Circuit path: ${circuitPath}`);

  // Create a unique working directory for this proof request
  const workingDir = path.join(CIRCUITS_DIR, `working-${randomUUID()}`);
  fs.mkdirSync(workingDir, { recursive: true });
  console.log(`Created working directory: ${workingDir}`);

  try {
    // Copy compiled circuit to working directory
    await execAsync(`cp -r "${circuitPath}"/* "${workingDir}"/`);
    console.log(`Copied circuit to working directory`);

    const inputsGenerator = new InputsGenerator(blueprint);

    const externalInputs = [
      {
        name: "command",
        value: command,
      },
    ];

    const circuitInputs = await inputsGenerator.generateInputs(
      rawEmail,
      externalInputs
    );

    // Convert circuit inputs to TOML and save as Prover.toml
    console.log("Converting circuit inputs to TOML format");
    const tomlContent = TOML.stringify(circuitInputs);
    const proverTomlPath = path.join(workingDir, "Prover.toml");
    fs.writeFileSync(proverTomlPath, tomlContent, "utf-8");
    console.log(`Saved Prover.toml to: ${proverTomlPath}`);

    // Run prove to generate the proof
    console.log("Running prove to generate proof...");
    await execAsync(`cd "${workingDir}" && nargo execute circuit > /dev/null`);
    await execAsync(
      `cd "${workingDir}" && bb prove --scheme ultra_honk --bytecode_path ./target/circuit.json --witness_path ./target/circuit.gz --output_path ./target --oracle_hash keccak --output_format bytes_and_fields> /dev/null`
    );

    // Load the generated proof and public inputs fields
    const proofFieldsPath = path.join(
      workingDir,
      "target",
      "proof_fields.json"
    );
    const publicInputsFieldsPath = path.join(
      workingDir,
      "target",
      "public_inputs_fields.json"
    );

    const proofFields = JSON.parse(fs.readFileSync(proofFieldsPath, "utf-8"));
    const publicInputsFields = JSON.parse(
      fs.readFileSync(publicInputsFieldsPath, "utf-8")
    );

    console.log("Proof fields:", proofFields);
    console.log("Public inputs fields:", publicInputsFields);

    return {
      proof: proofFields,
      publicInputs: publicInputsFields,
    };
  } catch (error) {
    console.error("Error in getProof:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace available"
    );
    throw error; // Re-throw to be handled by the endpoint
  } finally {
    // Clean up working directory
    try {
      fs.rmSync(workingDir, { recursive: true, force: true });
      console.log(`Cleaned up working directory: ${workingDir}`);
    } catch (cleanupError) {
      console.error(
        `Error cleaning up working directory ${workingDir}:`,
        cleanupError
      );
    }
  }
};

export const proveEndpoint = async (req: Request, res: Response) => {
  try {
    const { rawEmail, blueprintSlug, command } = req.body;

    // Validate required fields
    if (!rawEmail || !blueprintSlug || !command) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: rawEmail, blueprintSlug, and command are required",
      });
    }

    const result = await getProof(rawEmail, blueprintSlug, command);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating circuit inputs:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    });
  }
};

app.post("/prove", proveEndpoint);

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const server = app.listen(port, () => {
  console.log(`Noir Prover listening on port http://localhost:${port}`);
});

// Set server timeout to 2 hours (7200000 ms) for long-running proofs
server.timeout = 7200000;
server.keepAliveTimeout = 7200000;
server.headersTimeout = 7210000; // Slightly higher than keepAliveTimeout
