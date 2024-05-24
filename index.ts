import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import { generatePNGImage } from "./src/functions/generatePNGImage";
import { GenerateImageResult } from "./src/types";
import { generateThumbnailImage } from "./src/functions/generateThumbnailImage";
export { GenerateImageResult };
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
  anyImagesCreated: boolean;
}> => {
  const datFiles = await findDatFiles(datDirectory);
  const results: GenerateImageResult[] = [];
  let thumbnailsProcessed = false;
  let pngsProcessed = false;
  let anyImagesCreated = false;

  for (const filePath of datFiles) {
    if (outputType === "png" || outputType === "both") {
      const pngResult = await generatePNGImage({ filePath });
      results.push(pngResult);
      if (pngResult.imageCreated) {
        pngsProcessed = true;
        anyImagesCreated = true;
      }
    }

    if (outputType === "thumbnail" || outputType === "both") {
      const thumbnailResult = await generateThumbnailImage({ filePath });
      results.push(thumbnailResult);
      if (thumbnailResult.imageCreated) {
        thumbnailsProcessed = true;
        anyImagesCreated = true;
      }
    }
  }

  return { results, thumbnailsProcessed, pngsProcessed, anyImagesCreated };
};

export const generateMapImage = async (
  outputType: "png" | "thumbnail" | "both",
  directoryPath?: string
) => {
  const resolvedDirectoryPath =
    directoryPath || process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!resolvedDirectoryPath) {
    console.error(
      "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local and no directory path was provided."
    );
    return {
      message:
        "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local and no directory path was provided.",
      processedCount: 0,
      errors: true,
    };
  }

  try {
    const {
      results: processingResults,
      thumbnailsProcessed,
      pngsProcessed,
      anyImagesCreated,
    } = await processDirectory(resolvedDirectoryPath, outputType);
    const processedCount = processingResults.filter(
      (result) => result.status
    ).length;
    const errors = processingResults.filter((result) => !result.status);

    return {
      processedCount,
      errors: errors.length > 0,
      results: processingResults,
      thumbnailsProcessed,
      pngsProcessed,
      anyImagesCreated,
      errorDetails: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error processing directory:", error);
    return {
      message: "Error processing directory",
      processedCount: 0,
      errors: true,
    };
  }
};
