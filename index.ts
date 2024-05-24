import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import { generatePNGImage } from "./src/functions/generatePNGImage";
import { generateThumbnailImage } from "./src/functions/generateThumbnailImage";
import {
  GenerateImageResult,
  GenerateMapImageParams,
  GenerateMapImageResult,
} from "./src/types";
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
  type: "png" | "thumbnail" | "both",
  screenshotFileName?: string,
  thumbnailFileName?: string
): Promise<{
  results: GenerateImageResult[];
  processedCount: number;
  totalCount: number;
  updateNeeded: boolean;
}> => {
  const datFiles = await findDatFiles(datDirectory);
  const totalCount = datFiles.length;
  const results: GenerateImageResult[] = [];
  let updateNeeded = false;
  let processedCount = 0;

  for (const filePath of datFiles) {
    if (type === "png" || type === "both") {
      const pngResult = await generatePNGImage({
        filePath,
        outputFileName: screenshotFileName,
      });
      results.push(pngResult);
      if (pngResult.imageCreated) {
        updateNeeded = true;
        processedCount += 1;
      }
    }

    if (type === "thumbnail" || type === "both") {
      const thumbnailResult = await generateThumbnailImage({
        filePath,
        outputFileName: thumbnailFileName,
      });
      results.push(thumbnailResult);
      if (thumbnailResult.imageCreated) {
        updateNeeded = true;
        processedCount += 1;
      }
    }
  }

  return { results, processedCount, totalCount, updateNeeded };
};

export const generateMapImage = async ({
  type,
  directoryPath,
  screenshotFileName,
  thumbnailFileName,
}: GenerateMapImageParams): Promise<GenerateMapImageResult> => {
  const resolvedDirectoryPath =
    directoryPath || process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!resolvedDirectoryPath) {
    const message =
      "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local and no directory path was provided.";
    console.error(message);
    return {
      updateNeeded: false,
      processedCount: 0,
      totalCount: 0,
      errors: true,
      message,
    };
  }

  try {
    const {
      updateNeeded,
      results: processingResults,
      processedCount,
      totalCount,
    } = await processDirectory(
      resolvedDirectoryPath,
      type,
      screenshotFileName,
      thumbnailFileName
    );
    const errors = processingResults.filter((result) => !result.status);
    const errorCount = errors.length;

    const message =
      errorCount > 0
        ? `Processing completed with ${errorCount} errors.`
        : "Processing completed successfully.";

    return {
      updateNeeded,
      processedCount,
      totalCount,
      errors: errorCount > 0,
      message,
    };
  } catch (error: any) {
    const message = `Error processing directory: ${error.message}`;
    console.error(message);
    return {
      updateNeeded: false,
      processedCount: 0,
      totalCount: 0,
      errors: true,
      message,
    };
  }
};
