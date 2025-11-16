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
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

export const prove = async (
  rawEmail: string,
  blueprintSlug: string,
  command: string
) => {
  const { default: initZkEmail } = await import("@zk-email/sdk");
  const { initNoirWasm } = await import("@zk-email/sdk/initNoirWasm");

  const sdk = initZkEmail({
    baseUrl: "https://dev-conductor.zk.email",
    logging: { enabled: true, level: "debug" },
  });
  const blueprint = await sdk.getBlueprint(blueprintSlug);
  const prover = blueprint.createProver({ isLocal: true });

  const externalInputs = [
    {
      name: "command",
      value: command,
    },
  ];

  const noirWasm = await initNoirWasm();

  const proof = await prover.generateProof(rawEmail, externalInputs, {
    noirWasm,
  });

  const verification = await blueprint.verifyProof(proof, { noirWasm });

  return { proof, verification };
};

export const proveEndpoint = async (req: Request, res: Response) => {
  const { proof, verification } = await prove(
    req.body.rawEmail,
    req.body.blueprintSlug,
    req.body.command
  );
  res.status(200).json({ proof, verification });
};

app.post("/prove", proveEndpoint);

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Noir Prover listening on port http://localhost:${port}`);
});
