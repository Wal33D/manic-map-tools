import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";
import { generatePNGImage } from "./src/functions/pngGenerator";
import { generateThumbnailImage } from "./src/functions/thumbnailGenerator";

dotenv.config({ path: ".env.local" });

// Define types for the results
interface ImageResult {
  status: boolean;
  message: string;
  filePath?: string;
  thumbnailPath?: string;
  imageResult?: any;
  wallArray?: any;
  parsedData?: any;
  [key: string]: any; // To accommodate any additional properties
}

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
): Promise<ImageResult[]> => {
  const datFiles = await findDatFiles(datDirectory);
  const results: ImageResult[] = [];

  for (const filePath of datFiles) {
    if (outputType === "png" || outputType === "both") {
      const pngResult = await generatePNGImage({ filePath });
      results.push(pngResult);
    }

    if (outputType === "thumbnail" || outputType === "both") {
      const thumbnailResult = await generateThumbnailImage({ filePath });
      results.push(thumbnailResult);
    }
  }

  return results;
};

interface GenerateMapImageResult {
  message: string;
  processedCount: number;
  errors: boolean;
  results: ImageResult[];
}

export const generateMapImage = async (
  outputType: "png" | "thumbnail" | "both",
  directoryPath?: string
): Promise<GenerateMapImageResult> => {
  const resolvedDirectoryPath =
    directoryPath || process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!resolvedDirectoryPath) {
    const errorMessage =
      "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local and no directory path was provided.";
    console.error(errorMessage);
    return {
      message: errorMessage,
      processedCount: 0,
      errors: true,
      results: [],
    };
  }

  try {
    const processingResults = await processDirectory(
      resolvedDirectoryPath,
      outputType
    );
    const processedCount = processingResults.filter(
      (result) => result.status
    ).length;
    const message = "Processing completed";
    console.log(processingResults);
    return {
      message,
      processedCount,
      errors: false,
      results: processingResults,
    };
  } catch (error: any) {
    const errorMessage = "Error processing directory";
    console.error(errorMessage, error);
    return {
      message: errorMessage,
      processedCount: 0,
      errors: true,
      results: [],
    };
  }
};

interface InitResults {
  pngResults: GenerateMapImageResult | null;
  thumbnailResults: GenerateMapImageResult | null;
  error?: string;
}

const init = async (): Promise<InitResults> => {
  try {
    const pngResults = await generateMapImage("png");
    const thumbnailResults = await generateMapImage("thumbnail");

    return { pngResults, thumbnailResults };
  } catch (error: any) {
    console.error("Initialization error:", error);
    return { pngResults: null, thumbnailResults: null, error: error.message };
  }
};

// Example usage of init function
init().then((results) => {
  console.log("Final results:", results);
});
