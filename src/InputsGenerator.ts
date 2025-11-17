import {
  parseEmail,
  generateNoirCircuitInputsWithRegexesAndExternalInputs,
  init,
} from "@zk-email/relayer-utils";
import type { Blueprint } from "@zk-email/sdk";
import * as fs from "fs";
import * as path from "path";

let relayerUtilsResolver: (value: any) => void;
const relayerUtilsInit: Promise<void> = new Promise((resolve) => {
  relayerUtilsResolver = resolve;
});

init()
  .then(() => {
    relayerUtilsResolver(null);
  })
  .catch((err) => {
    console.error("Failed to initialize wasm for relayer-utils: ", err);
  });

export interface ExternalInput {
  name: string;
  maxLength: number;
}

export interface ExternalInputInput {
  name: string;
  value: string;
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
    // Wait for WASM initialization
    await relayerUtilsInit;
    console.log("WASM initialized");

    const parsedEmail = await parseEmail(eml);
    console.log("Email parsed");

    // Check cache (memory first, then disk)
    const cacheKey = getCacheKey(this.blueprint);
    let cached = blueprintCache.get(cacheKey);

    let circuit;
    let regexGraphs;

    if (cached) {
      console.log("Using cached circuit and regex graphs from memory");
      circuit = cached.circuit;
      regexGraphs = cached.regexGraphs;
    } else {
      // Try loading from disk
      const diskCache = loadCacheFromDisk(cacheKey);

      if (diskCache) {
        console.log("Loaded circuit and regex graphs from disk cache");
        circuit = diskCache.circuit;
        regexGraphs = diskCache.regexGraphs;

        // Also store in memory cache for faster subsequent access
        blueprintCache.set(cacheKey, diskCache);
      } else {
        console.log("Fetching circuit and regex graphs from API (first time)");
        circuit = await this.blueprint.getNoirCircuit();
        console.log("Circuit fetched");
        regexGraphs = await this.blueprint.getNoirRegexGraphs();
        console.log("Regex graphs fetched");

        const cacheData = { circuit, regexGraphs };

        // Cache in memory for this session
        blueprintCache.set(cacheKey, cacheData);

        // Save to disk for future restarts
        saveCacheToDisk(cacheKey, cacheData);

        console.log(
          `Cached circuit and regex graphs for blueprint: ${cacheKey}`
        );
      }
    }
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

    const circuitInputsMap =
      await generateNoirCircuitInputsWithRegexesAndExternalInputs(
        eml,
        regexInputs,
        externalInputsWithMaxLength,
        noirParams
      );

    console.log("Circuit inputs generated successfully (Map)");

    // Convert from Map to object (like in the SDK reference)
    const circuitInputs: any = {};
    for (const [key, value] of circuitInputsMap) {
      if (value && typeof value === "object" && value instanceof Map) {
        circuitInputs[key] = Object.fromEntries(value);
      } else if (value !== undefined) {
        circuitInputs[key] = value;
      }
    }

    console.log("Circuit inputs converted to object");
    console.log("Number of input fields:", Object.keys(circuitInputs).length);

    return circuitInputs;
  }
}

// Cache for circuit and regex graphs by blueprint slug
interface BlueprintCache {
  circuit: any;
  regexGraphs: any;
}

const blueprintCache = new Map<string, BlueprintCache>();

// Cache directory
const CACHE_DIR = path.join(process.cwd(), ".cache", "blueprints");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`Created cache directory: ${CACHE_DIR}`);
  }
}

function getCacheKey(blueprint: Blueprint): string {
  // Use the blueprint slug or id as cache key
  const key = blueprint.props.id?.toString();
  console.log("Blueprint id: ", blueprint.props.id);
  if (!key) {
    throw new Error("Blueprint must have an id for caching");
  }
  return key;
}

function getCacheFilePath(blueprintSlug: string): string {
  // Sanitize blueprint slug for filename (replace / with -)
  const safeSlug = blueprintSlug.replace(/\//g, "-");
  return path.join(CACHE_DIR, `${safeSlug}.json`);
}

// Load cache from disk
function loadCacheFromDisk(blueprintSlug: string): BlueprintCache | null {
  try {
    const filePath = getCacheFilePath(blueprintSlug);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const cache = JSON.parse(data);
      console.log(`Loaded cache from disk for blueprint: ${blueprintSlug}`);
      return cache;
    }
  } catch (error) {
    console.error(
      `Failed to load cache from disk for ${blueprintSlug}:`,
      error
    );
  }
  return null;
}

// Save cache to disk
function saveCacheToDisk(blueprintSlug: string, cache: BlueprintCache) {
  try {
    ensureCacheDir();
    const filePath = getCacheFilePath(blueprintSlug);
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), "utf-8");
    console.log(`Saved cache to disk for blueprint: ${blueprintSlug}`);
  } catch (error) {
    console.error(`Failed to save cache to disk for ${blueprintSlug}:`, error);
  }
}

// Utility function to clear cache (useful for testing or when blueprints are updated)
export function clearBlueprintCache(blueprintSlug?: string) {
  if (blueprintSlug) {
    // Clear from memory
    blueprintCache.delete(blueprintSlug);

    // Clear from disk
    try {
      const filePath = getCacheFilePath(blueprintSlug);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleared cache from disk for blueprint: ${blueprintSlug}`);
      }
    } catch (error) {
      console.error(`Failed to clear cache from disk:`, error);
    }

    console.log(`Cleared cache for blueprint: ${blueprintSlug}`);
  } else {
    // Clear all from memory
    blueprintCache.clear();

    // Clear all from disk
    try {
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        }
        console.log(`Cleared all caches from disk`);
      }
    } catch (error) {
      console.error(`Failed to clear all caches from disk:`, error);
    }

    console.log("Cleared all blueprint caches");
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
