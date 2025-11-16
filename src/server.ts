import express from "express";
import type { Request, Response } from "express";
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

export const proveEndpoint = (req: Request, res: Response) => {
  console.log(req.body);
  res.status(200).json(req.body);
};

app.post("/prove", proveEndpoint);

app.listen(port, () => {
  console.log(`Noir Prover listening on port http://localhost:${port}`);
});
