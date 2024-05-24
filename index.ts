import * as dotenv from "dotenv";
import { test } from "./scripts/generatePNGFromFiles";

dotenv.config({ path: ".env.local" });

async function init() {
  await test();
  console.log("========== Manic Miners Tools Overview ==========\n");

  console.log("Project Name: Manic Miners Tools");
  console.log("Version: 1.0.0");
  console.log("Author: Waleed Judah");
  console.log("License: MIT");
  console.log("\n");
}

init().catch((err) =>
  console.error("[ERROR] Error initializing project overview:", err)
);
