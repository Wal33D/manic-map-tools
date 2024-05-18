import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as chardet from "chardet";
import { Stats } from "fs";
import { colors } from "../src/functions/colorMap";

dotenv.config();

async function mapTileIntegrityCheck(baseDir: string): Promise<any> {
  const allTiles = new Set<number>();
  const tileOccurrences: { [key: number]: number } = {};
  const mapTileSets: Set<number>[] = [];
  let fileCount = 0;
  let failedCount = 0;
  let directoriesChecked = 0;
  let directoriesWithDatFiles = 0;
  const failedFiles: {
    path: string;
    size: number;
    metadata: Stats;
    encoding: string;
  }[] = [];

  async function traverseDirectory(directory: string): Promise<void> {
    directoriesChecked++;
    let datFileFound = false;

    try {
      const directoryContents = await fs.readdir(directory, {
        withFileTypes: true,
      });
      for (const dirent of directoryContents) {
        const fullPath = path.join(directory, dirent.name);
        if (dirent.isDirectory()) {
          await traverseDirectory(fullPath);
        } else if (dirent.name.endsWith(".dat")) {
          datFileFound = true;
          try {
            const encoding = chardet.detectFileSync(fullPath) || "utf8";
            const data = await fs.readFile(fullPath, "utf8");
            const normalizedData = data
              .replace(/\r\n/g, "\n")
              .replace(/\r/g, "\n");
            const tilesArray = extractTilesArray(normalizedData);
            if (tilesArray) {
              const tileSet = new Set(tilesArray);
              mapTileSets.push(tileSet);
              tilesArray.forEach((tile) => {
                allTiles.add(tile);
                tileOccurrences[tile] = (tileOccurrences[tile] || 0) + 1;
              });
              fileCount++;
            } else {
              console.log(
                `[FAIL] Failed to extract tiles from file: ${fullPath}`
              );
              const stats = await fs.stat(fullPath);
              failedFiles.push({
                path: fullPath,
                size: stats.size,
                metadata: stats,
                encoding,
              });
              failedCount++;
            }
          } catch (readError) {
            console.error(
              `[ERROR] Error reading file ${fullPath}: ${readError}`
            );
            const stats = await fs.stat(fullPath);
            const encoding = chardet.detectFileSync(fullPath) || "utf8";
            failedFiles.push({
              path: fullPath,
              size: stats.size,
              metadata: stats,
              encoding,
            });
            failedCount++;
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
  }

  function extractTilesArray(fileContent: string): number[] | null {
    try {
      const tilesMatch = fileContent.match(/tiles\s*\{\s*([^}]*)\s*\}/);
      if (tilesMatch) {
        const tilesString = tilesMatch[1];
        const tilesArray = tilesString
          .split(/[\s,]+/)
          .map((num) => num.trim())
          .filter((num) => num.length > 0 && num !== "-") // Filter out empty and invalid entries
          .map((num) => parseInt(num, 10))
          .filter((num) => !isNaN(num));
        return tilesArray;
      }
      return null;
    } catch (error) {
      console.error(
        `[ERROR] Error extracting tiles array from content:`,
        error
      );
      return null;
    }
  }

  function cleanKey(key: string): string {
    if (key.toLowerCase() === "rowcount" || key.toLowerCase() === "colcount") {
      console.error(`[WARNING] Found key with uppercase letters: ${key}`);
      return key.toLowerCase();
    }
    return key;
  }

  function alertIncorrectRowOrColCase(key: string): string {
    if (key.toLowerCase() === "rowcount" || key.toLowerCase() === "colcount") {
      console.error(`[WARNING] Found key with uppercase letters: ${key}`);
    }
    return key;
  }

  await traverseDirectory(baseDir);

  let commonTiles = new Set<number>([...allTiles]);
  mapTileSets.forEach((tileSet) => {
    commonTiles = new Set([...commonTiles].filter((tile) => tileSet.has(tile)));
  });

  const standoutTiles = [...allTiles].filter(
    (tile) => !colors.hasOwnProperty(tile)
  );
  const uniqueTiles = Object.keys(tileOccurrences)
    .map(Number)
    .filter((tile) => tileOccurrences[tile] === 1);

  const result = {
    processedFiles: fileCount,
    failedFiles: failedCount,
    directoriesChecked,
    directoriesWithDatFiles,
    totalUniqueTiles: allTiles.size,
    commonTiles: [...commonTiles],
    standoutTiles,
    uniqueTiles,
    failedFilesDetails: failedFiles,
  };

  console.log("========== Map Integrity Check Summary ==========");
  console.log(`Processed files: ${fileCount}`);
  console.log(`Failed to process files: ${failedCount}`);
  console.log(`Directories checked: ${directoriesChecked}`);
  console.log(`Directories with .dat files: ${directoriesWithDatFiles}`);
  console.log(
    `Standout tiles (not matching colormap): ${standoutTiles.join(", ")}`
  );

  if (failedFiles.length > 0) {
    console.log("========== Failed Files ==========");
    failedFiles.forEach((file) => {
      console.log("----------------------------------");
      console.log(`File: ${file.path}`);
      console.log(`Size: ${file.size} bytes`);
      console.log(`Encoding: ${file.encoding}`);
      console.log(`Metadata:`, file.metadata);
    });
    console.log("==================================");
  }

  return result;
}

async function init() {
  const directoryPath =
    process.env.MMT_CATALOG_DIR ||
    path.join(os.homedir(), "Desktop", "discordChannelBot", "catalog");
  const processingResults = await mapTileIntegrityCheck(directoryPath);
  console.log(processingResults);
}

init().catch((err) =>
  console.error("[ERROR] Error initializing map tile integrity check:", err)
);
