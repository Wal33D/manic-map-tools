import * as os from "os";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { ParsedMapData } from "../fileParser/types";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function logMapDataStats(baseDir: string): Promise<any> {
  let fileCount = 0;
  let failedCount = 0;
  const failedFiles: string[] = [];
  const mapDataResults: ParsedMapData[] = [];

  async function traverseDirectory(directory: string): Promise<void> {
    try {
      const directoryContents = await fs.readdir(directory, {
        withFileTypes: true,
      });
      for (const dirent of directoryContents) {
        const fullPath = path.join(directory, dirent.name);
        if (dirent.isDirectory()) {
          await traverseDirectory(fullPath);
        } else if (dirent.name.endsWith(".dat")) {
          fileCount++;
          try {
            const mapData = await parseMapDataFromFile({ filePath: fullPath });
            mapDataResults.push(mapData);
          } catch (parseError) {
            console.error(
              `[ERROR] Failed to parse file ${fullPath}: ${parseError}`
            );
            failedCount++;
            failedFiles.push(fullPath);
          }
        }
      }
    } catch (dirError) {
      console.error(
        `[ERROR] Error accessing directory ${directory}: ${dirError}`
      );
    }
  }

  await traverseDirectory(baseDir);

  const result = {
    processedFiles: fileCount,
    failedFiles: failedCount,
    mapDataResults,
    failedFilesDetails: failedFiles,
  };

  console.log("========== Map Data Parsing Results ==========");
  console.log(`Processed files: ${fileCount}`);
  console.log(`Failed to process files: ${failedCount}`);
  if (failedCount > 0) {
    console.log("Failed file paths:");
    failedFiles.forEach((file) => console.log(file));
  }

  return result;
}

async function init() {
  try {
    const directoryPath = process.env.MMT_MAPS_PROCESSED_DIR;
    rl.question(
      `The directory to be processed is: ${directoryPath}. Would you like to proceed? (yes/no): \n`,
      async (answer) => {
        if (answer.toLowerCase() === "yes") {
          const processingResults = await logMapDataStats(directoryPath);
          console.log("Parsed Map Data:");
          console.log(processingResults);
          console.log("=================================================");
        } else {
          console.log("[INFO] Process aborted by user.");
        }
        rl.close();
      }
    );
  } catch (err) {
    console.error("[ERROR] Error initializing map data parsing:", err);
  }
}

init();
