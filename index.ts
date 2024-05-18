import * as dotenv from "dotenv";

dotenv.config();

async function init() {
  console.log("========== Manic Miners Tools Overview ==========\n");

  console.log("Project Name: Manic Miners Tools");
  console.log("Version: 1.0.0");
  console.log("Author: Waleed Judah");
  console.log("License: MIT");
  console.log("\n");

  console.log("Scripts:");
  console.log("  clean - Removes the dist directory");
  console.log("  build - Compiles TypeScript files");
  console.log("  copy-assets - Copies assets to the dist directory");
  console.log("  prep - Cleans, builds, and copies assets");
  console.log("  cleanMapFiles - Cleans map files in the specified directory");
  console.log("  generateMapPNG - Generates PNG images from map files");
  console.log("  mapIntegrityCheck - Checks the integrity of map tiles");
  console.log("  determineAVGMapSize - Calculates average map sizes");
  console.log("  logMapDataStats - Logs statistics of map data");
  console.log("  minify - Minifies the project directory\n");

  console.log("Environment Variables:");
  console.log(`  MMT_CATALOG_DIR: ${process.env.MMT_CATALOG_DIR}`);
  console.log(`  MMT_CLEANME_DIR: ${process.env.MMT_CLEANME_DIR}`);
  console.log(`  MMT_MAPDATA_DIR: ${process.env.MMT_MAPDATA_DIR}\n`);

  console.log("Ignored Directories and Files:");
  console.log("  node_modules");
  console.log("  .vscode");
  console.log("  package-lock.json\n");

  console.log("Main Directories and Files:");
  console.log("  .env - Environment variables configuration file");
  console.log("  fileParser/ - Contains scripts for parsing map files");
  console.log("  scripts/ - Contains various scripts for different tasks");
  console.log("  src/ - Source files for the project");
  console.log("  package.json - Project metadata and dependencies\n");

  console.log("====================================================\n");

  console.log(
    "To get started, you can run any of the scripts listed above using npm."
  );
  console.log(
    "For example, to clean the map files, use: npm run cleanMapFiles\n"
  );
}

init().catch((err) =>
  console.error("[ERROR] Error initializing project overview:", err)
);
