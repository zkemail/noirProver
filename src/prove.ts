import {
  type DecomposedRegex,
  type ExternalInput,
  type ExternalInputInput,
  type ExternalInputProof,
  type GenerateProofOptions,
  type ProofStatus,
  type PublicProofData,
  type ZkFramework,
} from "./types";
import {
  parseEmail,
  generateNoirCircuitInputsWithRegexesAndExternalInputs,
  init as initRelayerUtils,
} from "@zk-email/relayer-utils";
import type { Blueprint } from "@zk-email/sdk";

// WASM initialization state
let wasmInitialized = false;

async function initWasm() {
  if (!wasmInitialized) {
    await initRelayerUtils();
    wasmInitialized = true;
  }
}

export function addMaxLengthToExternalInputs(
  externalInputs: ExternalInputInput[],
  externalInputDefinitions?: ExternalInput[]
) {
  const externalInputsWithMaxLength: (ExternalInputInput & {
    maxLength: number;
  })[] = [];
  if (externalInputDefinitions) {
    for (const externalInputDefinition of externalInputDefinitions) {
      const externalInput = externalInputs.find(
        (ei) => ei.name === externalInputDefinition.name
      );
      if (!externalInput) {
        throw new Error(
          `You must provide the external input for ${externalInputDefinition.name}`
        );
      }
      externalInputsWithMaxLength.push({
        ...externalInput,
        maxLength: externalInputDefinition.maxLength,
      });
    }
  }
  return externalInputsWithMaxLength;
}

export class InputsGenerator {
  private blueprint: Blueprint;
  constructor(blueprint: Blueprint) {
    this.blueprint = blueprint;
  }

  public async generateInputs(
    eml: string,
    externalInputs: ExternalInputInput[]
  ) {
    // Initialize WASM before using parseEmail
    await initWasm();
    console.log("WASM initialized");
    const parsedEmail = await parseEmail(eml);
    console.log("Email parsed");
    const circuit = await this.blueprint.getNoirCircuit();
    console.log("Circuit fetched");
    const regexGraphs = await this.blueprint.getNoirRegexGraphs();
    console.log("Regex graphs fetched");
    const regexInputs = this.blueprint.props.decomposedRegexes.map((dr) => {
      const regexGraph = regexGraphs[`${dr.name}_regex.json`];
      if (!regexGraph) {
        throw new Error(
          `No regexGraph was compiled for decomposedRegexe ${dr.name}`
        );
      }

      // const haystack =
      //   dr.location === "header" ? parsedEmail.canonicalizedHeader : parsedEmail.cleanedBody;

      let haystack;
      if (dr.location === "header") {
        haystack = parsedEmail.canonicalizedHeader;
      } else if (this.blueprint.props.shaPrecomputeSelector) {
        haystack = parsedEmail.cleanedBody.split(
          this.blueprint.props.shaPrecomputeSelector
        )[1];
      } else {
        haystack = parsedEmail.cleanedBody;
      }

      let haystack_location;
      if (dr.location === "header") {
        haystack_location = "Header";
      } else {
        haystack_location = "Body";
      }
      console.log("Haystack location: ", haystack_location);
      const maxHaystackLength =
        dr.location === "header"
          ? this.blueprint.props.emailHeaderMaxLength
          : this.blueprint.props.emailBodyMaxLength;

      return {
        name: dr.name,
        regex_graph_json: JSON.stringify(regexGraph),
        haystack_location,
        max_haystack_length: maxHaystackLength,
        max_match_length: dr.maxMatchLength || dr.maxLength,
        parts: dr.parts.map((p) => ({
          // @ts-ignore
          is_public: p.isPublic || !!p.is_public,
          // @ts-ignore
          regex_def: p.regexDef || !!p.regex_def,
          // @ts-ignore
          ...(p.isPublic && { maxLength: p.maxLength || !!p.max_length }),
        })),
        proving_framework: "noir",
      };
    });

    console.log("Regex inputs: ", regexInputs);

    const noirParams = {
      maxHeaderLength: this.blueprint.props.emailHeaderMaxLength || 512,
      maxBodyLength: this.blueprint.props.emailBodyMaxLength || 0,
      ignoreBodyHashCheck: this.blueprint.props.ignoreBodyHashCheck,
      removeSoftLineBreaks: this.blueprint.props.removeSoftLinebreaks,
      shaPrecomputeSelector: this.blueprint.props.shaPrecomputeSelector,
      proverEthAddress: "0x0000000000000000000000000000000000000000",
    };

    console.log("External inputs: ", externalInputs);

    const externalInputsWithMaxLength = addMaxLengthToExternalInputs(
      externalInputs,
      this.blueprint.props.externalInputs
    );

    console.log("externalInputsWithMaxLength: ", externalInputsWithMaxLength);

    const circuitInputs =
      await generateNoirCircuitInputsWithRegexesAndExternalInputs(
        eml,
        regexInputs,
        externalInputsWithMaxLength,
        noirParams
      );
    console.log("circuitInputs: ", circuitInputs);
    return circuitInputs;
  }
}
