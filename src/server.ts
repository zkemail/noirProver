import express from "express";
import type { Request, Response } from "express";
const app = express();
const port = 3000;

export const proveEndpoint = (req: Request, res: Response) => {
  res.status(200).json({ proof: "proof" });
};

app.post("/prove", proveEndpoint);

app.listen(port, () => {
  console.log(`Noir Prover listening on port http://localhost:${port}`);
});
