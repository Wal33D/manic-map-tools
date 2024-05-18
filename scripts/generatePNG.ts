require("dotenv").config();
const fs = require("fs").promises;
import path from "path";
import { generatePNG } from "../src/functions/generatePNG";
import { create2DArray } from "../src/functions/create2DArray";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";

export async function generatePNGFromFiles(
  filePaths: string[] | string
): Promise<{ success: boolean }[]> {
  const files = Array.isArray(filePaths) ? filePaths : [filePaths];
  const results = [];

  for (const filePath of files) {
    const outputFilePath = filePath.replace(/\.dat$/, ".png");
    try {
      const parsedData = await parseMapDataFromFile({ filePath });
      const wallArray = create2DArray({
        data: parsedData.tilesArray,
        width: parsedData.colcount,
      });

      const image = await generatePNG(wallArray, parsedData.biome);
      await image.toFile(outputFilePath);
      console.log("Image padded with border and saved as " + outputFilePath);
      results.push({ success: true, filePath: outputFilePath });
    } catch (error) {
      console.error("Error processing file:", filePath, error);
      results.push({ success: false, filePath: outputFilePath });
    }
  }

  return results;
}
// Helper function to find all dat files recursively in a directory
async function findAllDatFiles(dir: any) {
  let results: any[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await findAllDatFiles(fullPath)); // Recursively find in subdirectories
    } else if (entry.isFile() && entry.name.endsWith(".dat")) {
      results.push(fullPath); // Collect dat files
    }
  }
  return results;
}

// Function to process all dat files in a directory and its subdirectories
export async function processDirectory(datDirectory: string) {
  const datFiles = await findAllDatFiles(datDirectory);
  const results = [];

  for (const filePath of datFiles) {
    const outputFilePath = filePath.replace(/\.dat$/, ".png");
    try {
      const parsedData = await parseMapDataFromFile({ filePath });
      const wallArray = create2DArray({
        data: parsedData.tilesArray,
        width: parsedData.colcount,
      });
      //   console.log(parsedData);
      const image = await generatePNG(wallArray, parsedData.biome);
      await image.toFile(outputFilePath);
      console.log("Image padded with border and saved as " + outputFilePath);
      results.push({ success: true, filePath: outputFilePath });
    } catch (error) {
      console.error("Error processing file:", filePath, error);
      results.push({ success: false, filePath: outputFilePath });
    }
  }

  return results;
}

// Generate PNGs for all .dat levels in the directory
async function init() {
  const directoryPath = process.env.MMT_PNGME_DIR;
  const processingResults = await processDirectory(directoryPath);
  console.log(processingResults);
}

init();
