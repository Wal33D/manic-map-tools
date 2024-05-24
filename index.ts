import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import { generatePNGImage } from "./src/functions/pngGenerator";
import { generateThumbnailImage } from "./src/functions/thumbnailGenerator";

dotenv.config({ path: ".env.local" });

const findDatFiles = async (dir: string): Promise<string[]> => {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findDatFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".dat")) {
      results.push(fullPath);
    }
  }

  return results;
};

const processDirectory = async (
  datDirectory: string,
  outputType: "png" | "thumbnail" | "both"
) => {
  const datFiles = await findDatFiles(datDirectory);
  const results = [];

  for (const filePath of datFiles) {
    if (outputType === "png" || outputType === "both") {
      const pngResult = await generatePNGImage(filePath);
      results.push(pngResult);
    }

    if (outputType === "thumbnail" || outputType === "both") {
      const thumbnailResult = await generateThumbnailImage(filePath);
      results.push(thumbnailResult);
    }
  }

  return results;
};

const initProcess = async (outputType: "png" | "thumbnail" | "both") => {
  const directoryPath = process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!directoryPath) {
    console.error("HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local");
    return {
      message: "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local",
      processedCount: 0,
      errors: true,
    };
  }

  try {
    const processingResults = await processDirectory(directoryPath, outputType);
    const processedCount = processingResults.filter(
      (result) => result.success
    ).length;
    const message = "Processing completed";
    console.log(processingResults);
    return { message, processedCount, errors: false };
  } catch (error) {
    console.error("Error processing directory:", error);
    return {
      message: "Error processing directory",
      processedCount: 0,
      errors: true,
    };
  }
};

async function init() {
  await initProcess("both");
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
