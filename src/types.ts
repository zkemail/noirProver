export interface DecomposedRegex {
  name: string;
  location: "header" | "body";
  maxLength?: number;
  maxMatchLength?: number;
  parts: Array<{
    isPublic?: boolean;
    is_public?: boolean;
    regexDef?: string;
    regex_def?: string;
    maxLength?: number;
    max_length?: number;
  }>;
}

export interface ExternalInput {
  name: string;
  maxLength: number;
}

export interface ExternalInputInput {
  name: string;
  value: string;
}

export interface ExternalInputProof {
  name: string;
  value: string;
  maxLength: number;
}

export interface GenerateProofOptions {
  noirWasm?: any;
}

export type ProofStatus = "pending" | "processing" | "completed" | "failed";

export interface PublicProofData {
  proof: any;
  publicInputs: any;
}

export type ZkFramework = "noir" | "circom";

