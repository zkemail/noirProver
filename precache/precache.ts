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

async function prepareCircuit(slug: string, refresh: boolean): Promise<void> {
  const { default: initZkEmail } = await import("@zk-email/sdk");
  const sdk = initZkEmail({ baseUrl: "https://dev-conductor.zk.email" });

  console.log(`\nFetching blueprint: ${slug}`);
  const blueprint = await sdk.getBlueprint(slug);
  const blueprintId = blueprint.props.id;

  if (!blueprintId) throw new Error(`No ID found for blueprint: ${slug}`);
  if (!/^[a-zA-Z0-9_\-]+$/.test(blueprintId))
    throw new Error(`Invalid blueprint ID format: ${blueprintId}`);

  const circuitDir = path.join(CIRCUITS_DIR, blueprintId);
  const zipPath = path.join(CIRCUITS_DIR, `${blueprintId}.zip`);
  const compiledMarker = path.join(circuitDir, ".compiled");

  if (refresh && fs.existsSync(circuitDir)) {
    console.log(`Refreshing: removing existing circuit for ${slug}...`);
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

async function main() {
  const refresh = process.argv.includes("--refresh");
  const slugs: string[] = JSON.parse(fs.readFileSync(BLUEPRINTS_FILE, "utf-8"));
  console.log(
    `Pre-caching ${slugs.length} blueprint(s)...${refresh ? " (refresh mode)" : ""}`,
  );

  for (const slug of slugs) {
    try {
      await prepareCircuit(slug, refresh);
    } catch (err) {
      console.error(`✗ Failed to cache ${slug}:`, err);
      process.exit(1);
    }
  }

  console.log("\n✓ All circuits pre-cached successfully.");
  process.exit(0);
}

main();
