import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config({ path: ".env.local" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function calculateMapSizeStats(baseDir: string): Promise<any> {
  let totalSize = 0;
  let fileCount = 0;
  let failedCount = 0;
  let minSize = Infinity;
  let maxSize = -Infinity;
  let failedFiles: string[] = [];
  let emptyDatDirectories: string[] = [];
  let directoriesChecked = 0;
  let directoriesWithDatFiles = 0;

  async function traverseDirectory(directory: string): Promise<boolean> {
    directoriesChecked++;
    let datFileFound = false;

    try {
      const directoryContents = await fs.readdir(directory, {
        withFileTypes: true,
      });
      for (const dirent of directoryContents) {
        const fullPath = path.join(directory, dirent.name);
        if (dirent.isDirectory()) {
          const isEmpty = await traverseDirectory(fullPath);
          if (isEmpty) {
            emptyDatDirectories.push(fullPath);
          }
        } else if (dirent.name.endsWith(".dat")) {
          datFileFound = true;
          try {
            const data = await fs.readFile(fullPath, "utf8");
            const size = parseMapSize(data);
            if (size !== null) {
              totalSize += size;
              fileCount++;
              if (size < minSize) minSize = size;
              if (size > maxSize) maxSize = size;
            } else {
              failedCount++;
              failedFiles.push(fullPath);
            }
          } catch (readError) {
            console.error(
              `[ERROR] Error reading file ${fullPath}: ${readError}`
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

    if (datFileFound) {
      directoriesWithDatFiles++;
    }

    return !datFileFound;
  }

  function parseMapSize(fileContent: string): number | null {
    const rowMatch = fileContent.match(/rowcount:\s*(\d+)/);
    const colMatch = fileContent.match(/colcount:\s*(\d+)/);
    if (rowMatch && colMatch) {
      return parseInt(rowMatch[1], 10) * parseInt(colMatch[1], 10);
    }
    return null;
  }

  const isEmpty = await traverseDirectory(baseDir);
  if (isEmpty) {
    emptyDatDirectories.push(baseDir);
  }

  const averageSize = fileCount > 0 ? (totalSize / fileCount).toFixed(2) : 0;

  const result = {
    processedFiles: fileCount,
    failedFiles: failedCount,
    directoriesChecked,
    directoriesWithDatFiles,
    averageSize,
    minSize,
    maxSize,
    failedFilesDetails: failedFiles,
    emptyDatDirectories,
  };

  console.log("========== Manic Miners Map Tool Statistics ==========");
  console.log(`Processed files: ${fileCount}`);
  console.log(`Failed to process files: ${failedCount}`);
  console.log(`Directories checked: ${directoriesChecked}`);
  console.log(`Directories with .dat files: ${directoriesWithDatFiles}`);
  if (failedCount > 0) {
    console.log("Failed file paths:");
    failedFiles.forEach((file) => console.log(file));
  }
  if (emptyDatDirectories.length > 0) {
    console.log("Directories without .dat files:");
    emptyDatDirectories.forEach((dir) => console.log(dir));
  }
  console.log(`Average map size: ${averageSize}`);
  console.log(`Minimum map size: ${minSize}`);
  console.log(`Maximum map size: ${maxSize}`);
  console.log("======================================================");

  return result;
}

async function init() {
  try {
    const directoryPath = process.env.MMT_CATALOG_DIR;

    rl.question(
      `The directory to be processed is: ${directoryPath}. Would you like to proceed? (yes/no): \n`,
      async (answer) => {
        if (answer.toLowerCase() === "yes") {
          const processingResults = await calculateMapSizeStats(directoryPath);
          console.log(processingResults);
        } else {
          console.log("[INFO] Process aborted by user.");
        }
        rl.close();
      }
    );
  } catch (err) {
    console.error(
      "[ERROR] Error initializing map size stats calculation:",
      err
    );
  }
}

init();
