// Polyfills required by @zk-email/sdk
if (typeof (globalThis as any).self === "undefined") {
  (globalThis as any).self = globalThis;
}
if (typeof (globalThis as any).Worker === "undefined") {
  const { default: Worker } = await import("web-worker");
  (globalThis as any).Worker = Worker;
}
if (typeof (globalThis as any).indexedDB === "undefined") {
  const { default: indexedDB } = await import("fake-indexeddb");
  (globalThis as any).indexedDB = indexedDB;
}

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { promisify } from "util";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CIRCUITS_DIR = path.join(process.cwd(), ".cache", "circuits");
const BLUEPRINTS_FILE = path.join(__dirname, "blueprints.json");

// --- Helpers ---

function getCircuitDirs(): string[] {
  if (!fs.existsSync(CIRCUITS_DIR)) return [];
  return fs.readdirSync(CIRCUITS_DIR).filter((name) => {
    const fullPath = path.join(CIRCUITS_DIR, name);
    return fs.statSync(fullPath).isDirectory() && !name.startsWith("working-");
  });
}

function readSlugFile(circuitDir: string): string | null {
  const slugFile = path.join(CIRCUITS_DIR, circuitDir, ".slug");
  return fs.existsSync(slugFile)
    ? fs.readFileSync(slugFile, "utf-8").trim()
    : null;
}

function findCircuitDirBySlug(slug: string): string | null {
  for (const dir of getCircuitDirs()) {
    if (readSlugFile(dir) === slug) return dir;
  }
  return null;
}

async function downloadFile(
  url: string,
  destPath: string,
  maxRedirects: number = 5,
): Promise<void> {
  if (maxRedirects <= 0) throw new Error("Too many redirects");
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const cleanup = () => {
      file.close();
      fs.unlink(destPath, () => {});
    };
    https
      .get(url, (response) => {
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 303 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          file.close();
          if (response.headers.location) {
            downloadFile(response.headers.location, destPath, maxRedirects - 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(
              new Error(
                `Redirect with no location header (HTTP ${response.statusCode})`,
              ),
            );
          }
          return;
        }
        if (
          !response.statusCode ||
          response.statusCode < 200 ||
          response.statusCode >= 300
        ) {
          response.resume();
          cleanup();
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        cleanup();
        reject(err);
      });
  });
}

// --- Commands ---

function listCached(): void {
  const dirs = getCircuitDirs();
  if (dirs.length === 0) {
    console.log("No circuits cached.");
    return;
  }
  console.log(`Cached circuits (${dirs.length}):\n`);
  for (const dir of dirs) {
    const slug = readSlugFile(dir) ?? "(unknown)";
    const compiledMarker = path.join(CIRCUITS_DIR, dir, ".compiled");
    const compiled = fs.existsSync(compiledMarker)
      ? fs.readFileSync(compiledMarker, "utf-8").trim()
      : "not compiled";
    console.log(`  ${slug}`);
    console.log(`    id:       ${dir}`);
    console.log(`    compiled: ${compiled}`);
  }
}

function clearCircuits(slug?: string): void {
  if (slug) {
    const dir = findCircuitDirBySlug(slug);
    if (!dir) {
      console.log(`No cached circuit found for: ${slug}`);
      return;
    }
    fs.rmSync(path.join(CIRCUITS_DIR, dir), { recursive: true, force: true });
    console.log(`✓ Cleared: ${slug} (${dir})`);
  } else {
    const dirs = getCircuitDirs();
    if (dirs.length === 0) {
      console.log("No circuits to clear.");
      return;
    }
    for (const dir of dirs) {
      const s = readSlugFile(dir) ?? dir;
      fs.rmSync(path.join(CIRCUITS_DIR, dir), { recursive: true, force: true });
      console.log(`✓ Cleared: ${s} (${dir})`);
    }
  }
}

async function precacheCircuit(slug: string, refresh: boolean): Promise<void> {
  const { initZkEmailSdk: initZkEmail } = await import("@zk-email/sdk");
  const sdk = initZkEmail({ baseUrl: process.env.CONDUCTOR_URL || "https://staging-conductor.zk.email" });

  console.log(`\nFetching blueprint: ${slug}`);
  const blueprint = await sdk.getBlueprint(slug);
  const blueprintId = blueprint.props.id;

  if (!blueprintId) throw new Error(`No ID found for blueprint: ${slug}`);
  if (!/^[a-zA-Z0-9_\-]+$/.test(blueprintId))
    throw new Error(`Invalid blueprint ID format: ${blueprintId}`);

  const circuitDir = path.join(CIRCUITS_DIR, blueprintId);
  const zipPath = path.join(CIRCUITS_DIR, `${blueprintId}.zip`);
  const compiledMarker = path.join(circuitDir, ".compiled");
  const slugFile = path.join(circuitDir, ".slug");

  if (refresh && fs.existsSync(circuitDir)) {
    console.log(`Refreshing: removing existing circuit...`);
    fs.rmSync(circuitDir, { recursive: true, force: true });
  }

  if (!refresh && fs.existsSync(circuitDir) && fs.existsSync(compiledMarker)) {
    console.log(`✓ Already compiled: ${slug} (${blueprintId})`);
    return;
  }

  fs.mkdirSync(CIRCUITS_DIR, { recursive: true });

  if (!fs.existsSync(circuitDir)) {
    const downloadUrl = await blueprint.getNoirCircuitDownloadLink();
    console.log(`Downloading circuit...`);
    await downloadFile(downloadUrl, zipPath);
    console.log(`Extracting circuit...`);
    await execAsync(`unzip -q "${zipPath}" -d "${circuitDir}"`);
    fs.unlinkSync(zipPath);
  }

  // Save slug for identification
  fs.writeFileSync(slugFile, slug, "utf-8");

  // Normalize circuit name in Nargo.toml
  const nargoTomlPath = path.join(circuitDir, "Nargo.toml");
  if (fs.existsSync(nargoTomlPath)) {
    let nargoToml = fs.readFileSync(nargoTomlPath, "utf-8");
    nargoToml = nargoToml.replace(/^name\s*=\s*".*"$/m, 'name = "circuit"');
    fs.writeFileSync(nargoTomlPath, nargoToml, "utf-8");
  }

  console.log(`Compiling circuit (this may take a while)...`);
  await execAsync(`cd "${circuitDir}" && nargo compile`);

  fs.writeFileSync(compiledMarker, new Date().toISOString(), "utf-8");
  console.log(`✓ Compiled and cached: ${slug} (${blueprintId})`);
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const hasFlag = (flag: string) => args.includes(flag);
  const slugArg = args.find((a) => !a.startsWith("--"));

  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(`
Circuit Pre-cache Script

Usage:
  npm run precache                          Pre-cache all blueprints in blueprints.json
  npm run precache -- <slug>                Pre-cache one specific blueprint
  npm run precache -- --refresh             Re-download and recompile all blueprints
  npm run precache -- --refresh <slug>      Re-download and recompile one specific blueprint
  npm run precache -- --clear               Remove all cached circuits
  npm run precache -- --clear <slug>        Remove one specific cached circuit
  npm run precache -- --list                List all currently cached circuits
  npm run precache -- --help                Show this help
`);
    process.exit(0);
  }

  if (hasFlag("--list")) {
    listCached();
    process.exit(0);
  }

  if (hasFlag("--clear")) {
    clearCircuits(slugArg);
    process.exit(0);
  }

  const refresh = hasFlag("--refresh");
  const slugs: string[] = slugArg
    ? [slugArg]
    : JSON.parse(fs.readFileSync(BLUEPRINTS_FILE, "utf-8"));

  console.log(
    `Pre-caching ${slugs.length} blueprint(s)...${refresh ? " (refresh mode)" : ""}`,
  );

  // Print status of all currently cached circuits first
  const cachedDirs = getCircuitDirs();
  if (cachedDirs.length > 0) {
    console.log("\nCurrently cached:");
    for (const dir of cachedDirs) {
      const s = readSlugFile(dir) ?? "(unknown)";
      console.log(`  ✓ ${s} (${dir})`);
    }
  }

  console.log("\nSelected for pre-caching:");
  for (const slug of slugs) {
    const dir = findCircuitDirBySlug(slug);
    const compiled =
      dir && fs.existsSync(path.join(CIRCUITS_DIR, dir, ".compiled"));
    console.log(`  ${compiled && !refresh ? "✓ cached" : "→ pending"} ${slug}`);
  }
  console.log();

  for (const slug of slugs) {
    try {
      await precacheCircuit(slug, refresh);
    } catch (err) {
      console.error(`✗ Failed to cache ${slug}:`, err);
      process.exit(1);
    }
  }

  console.log("\n✓ Done.");
  process.exit(0);
}

main();
