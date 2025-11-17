// Test script - assumes server is running on localhost:3000
// Run with: npm run start:node (in another terminal)
// Then: node --loader tsx src/__test__/server.test.ts

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL = "http://localhost:3000";

async function testProveEndpoint(
  emailFile: string,
  blueprintSlug: string,
  testName: string,
  command: string
) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`Email: ${emailFile}`);
  console.log(`Blueprint: ${blueprintSlug}`);

  try {
    const rawEmail = fs.readFileSync(
      path.join(__dirname, "fixtures", emailFile),
      "utf8"
    );

    const requestBody = {
      rawEmail,
      blueprintSlug,
      command,
    };
    console.log("➡️ Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${SERVER_URL}/prove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Success!`);
    console.log(
      `Proof generated:`,
      JSON.stringify(result, null, 2).slice(0, 500) + "..."
    );
    return result;
  } catch (error) {
    console.error(`❌ Failed:`, error);
    throw error;
  }
}

async function testHealthEndpoint() {
  console.log(`\n🏥 Testing health endpoint...`);
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const result = (await response.json()) as { status: string };

    if (result.status === "ok") {
      console.log(`✅ Health check passed!`);
      return true;
    } else {
      throw new Error("Health check failed");
    }
  } catch (error) {
    console.error(`❌ Health check failed:`, error);
    return false;
  }
}

async function runTests(testType?: string) {
  console.log("🚀 Starting Noir Prover Tests");
  console.log(`Server URL: ${SERVER_URL}\n`);

  // Health check
  const isHealthy = await testHealthEndpoint();
  if (!isHealthy) {
    console.error("\n❌ Server is not healthy. Exiting.");
    process.exit(1);
  }

  try {
    if (!testType || testType === "x") {
      // Test 1: X (Twitter) email
      await testProveEndpoint(
        "x.eml",
        "benceharomi/x_handle@v1",
        "X Password Reset Email",
        "command"
      );
    }

    if (!testType || testType === "discord") {
      // Test 2: Discord email
      await testProveEndpoint(
        "discord.eml",
        "zkemail/discord@v1",
        "Discord Email",
        "command"
      );
    }

    if (testType && testType !== "x" && testType !== "discord") {
      console.error(`\n❌ Unknown test type: ${testType}`);
      console.log("Available tests: x, discord");
      process.exit(1);
    }

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Tests failed!");
    process.exit(1);
  }
}

// Get test type from command line args
const testType = process.argv[2];

// Run tests
runTests(testType).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
