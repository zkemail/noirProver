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
import { InputsGenerator } from "./prove";
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

export const prove = async (
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

  const processingTime = Date.now() - startTime;

  return {
    success: true,
    circuitInputs,
    metadata: {
      blueprintSlug,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    },
  };
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

    const result = await prove(rawEmail, blueprintSlug, command);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating circuit inputs:", error);
    res.status(500).json({
      success: false,
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

app.listen(port, () => {
  console.log(`Noir Prover listening on port http://localhost:${port}`);
});
