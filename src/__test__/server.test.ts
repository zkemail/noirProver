import { proveEndpoint } from "../server";
import type { Request, Response } from "express";

describe("Prove Endpoint", () => {
  it("should return proof with status 200", () => {
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    proveEndpoint(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ proof: "proof" });
  });
});
