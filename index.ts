import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import { generatePNGImage } from "./src/functions/generatePNGImage";
import { generateThumbnailImage } from "./src/functions/generateThumbnailImage";
import { GenerateImageResult, GenerateMapImageResult } from "./src/types";
export { GenerateImageResult, GenerateMapImageResult } from "./src/types";

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
): Promise<{
  results: GenerateImageResult[];
  thumbnailsProcessed: boolean;
  pngsProcessed: boolean;
  updateNeeded: boolean;
}> => {
  const datFiles = await findDatFiles(datDirectory);
  const results: GenerateImageResult[] = [];
  let thumbnailsProcessed = false;
  let pngsProcessed = false;
  let updateNeeded = false;

  for (const filePath of datFiles) {
    if (outputType === "png" || outputType === "both") {
      const pngResult = await generatePNGImage({ filePath });
      results.push(pngResult);
      if (pngResult.imageCreated) {
        pngsProcessed = true;
        updateNeeded = true;
      }
    }

    if (outputType === "thumbnail" || outputType === "both") {
      const thumbnailResult = await generateThumbnailImage({ filePath });
      results.push(thumbnailResult);
      if (thumbnailResult.imageCreated) {
        thumbnailsProcessed = true;
        updateNeeded = true;
      }
    }
  }

  return { results, thumbnailsProcessed, pngsProcessed, updateNeeded };
};

export const generateMapImage = async (
  outputType: "png" | "thumbnail" | "both",
  directoryPath?: string
): Promise<GenerateMapImageResult> => {
  const resolvedDirectoryPath =
    directoryPath || process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!resolvedDirectoryPath) {
    console.error(
      "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local and no directory path was provided."
    );
    return {
      updateNeeded: false,
      processedCount: 0,
      thumbnailsProcessed: false,
      pngsProcessed: false,
      errors: true,
    };
  }

  try {
    const {
      updateNeeded,
      results: processingResults,
      thumbnailsProcessed,
      pngsProcessed,
    } = await processDirectory(resolvedDirectoryPath, outputType);
    const processedCount = processingResults.filter(
      (result) => result.status
    ).length;
    const errors = processingResults.filter((result) => !result.status);

    return {
      updateNeeded,
      processedCount,
      thumbnailsProcessed,
      pngsProcessed,
      errors: errors.length > 0,
    };
  } catch (error) {
    console.error("Error processing directory:", error);
    return {
      processedCount: 0,
      updateNeeded: false,
      thumbnailsProcessed: false,
      pngsProcessed: false,
      errors: true,
    };
  }
};
