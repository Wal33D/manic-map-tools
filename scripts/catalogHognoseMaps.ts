import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

import { generatePNG } from "../src/functions/generatePNG";
import { create2DArray } from "../src/functions/create2DArray";
import { generateThumbnail } from "../src/functions/generateThumbnail";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { generateShortDescription } from "../utils/generateShortDescription";
import {
  constructDescription,
  constructHtmlDescription,
} from "../utils/constructDescriptions";

dotenv.config({ path: ".env.local" });

const {
  HOGNOSE_LEVELS_DOWNLOAD_DIR: DOWNLOAD_DIR,
  HOGNOSE_LEVELS_CATALOG_DIR: CATALOG_DIR,
} = process.env;

if (!DOWNLOAD_DIR || !CATALOG_DIR) {
  console.error(
    "Error: Both HOGNOSE_LEVELS_DOWNLOAD_DIR and HOGNOSE_LEVELS_CATALOG_DIR must be set in the .env file."
  );
  process.exit(1);
}

const INDEX_FILE_PATH = path.resolve(DOWNLOAD_DIR, "hognose_index.json");
const CATALOG_INDEX_FILE_PATH = path.resolve(CATALOG_DIR, "catalog_index.json");

const extractSeed = (filePath: string): string =>
  fs.readFileSync(filePath, "utf8").match(/seed:\s*(0x[0-9a-fA-F]+)/)?.[1] ||
  "Unknown";

const createCatalogData = (
  parsedData: any,
  datFile: string,
  targetDir: string,
  indexData: any
) => ({
  catalog: "Hognose",
  catalogType: "Level",
  archived: false,
  procedurallyGenerated: true,
  seed: extractSeed(path.resolve(targetDir, datFile)),
  catalogId: path.basename(targetDir),
  title: parsedData.levelname || datFile.replace(".dat", ""),
  postedDate: indexData.downloadedAt,
  author: "charredUtensil",

  mainFile: datFile,
  thumbnail: "thumbnail_render.png",
  screenshot: "screenshot_render.png",
  shortDescription: generateShortDescription(parsedData),
  textDescription: constructDescription(parsedData),
  htmlDescription: constructHtmlDescription(parsedData),
  url: "https://github.com/charredUtensil/hognose",
  path: targetDir,
  files: [
    {
      fileName: datFile,
      fileSize: `${(
        fs.statSync(path.resolve(targetDir, datFile)).size / 1024
      ).toFixed(2)} KB`,
    },
  ],
});

async function organizeDatFiles() {
  try {
    if (!fs.existsSync(INDEX_FILE_PATH))
      throw new Error(`Index file not found at ${INDEX_FILE_PATH}`);

    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE_PATH, "utf8"));
    let catalogIndex = fs.existsSync(CATALOG_INDEX_FILE_PATH)
      ? JSON.parse(fs.readFileSync(CATALOG_INDEX_FILE_PATH, "utf8"))
      : { catalog: "Hognose", catalogType: "Level", entries: [] };

    const processedFiles = new Set(
      catalogIndex.entries.map((entry: any) => entry.catalogId)
    );

    for (const datFile of indexData.datFiles) {
      const targetDirName = datFile.replace(".dat", "");
      if (processedFiles.has(targetDirName)) {
        console.log(`Skipping already processed file: ${datFile}`);
        continue;
      }

      const sourcePath = path.resolve(DOWNLOAD_DIR, datFile);
      const targetDir = path.resolve(CATALOG_DIR, targetDirName);
      const targetPath = path.resolve(targetDir, datFile);

      if (!fs.existsSync(targetDir))
        fs.mkdirSync(targetDir, { recursive: true });

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${datFile} to ${targetDir}`);

      const parsedData = await parseMapDataFromFile({ filePath: sourcePath });
      const wallArray = create2DArray({
        data: parsedData.tilesArray,
        width: parsedData.colcount,
      });

      const thumbnailBuffer = await generateThumbnail(wallArray);
      const thumbnailPath = path.resolve(targetDir, "thumbnail_render.png");
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      const pngBuffer = await generatePNG(wallArray, parsedData.biome);
      const pngPath = path.resolve(targetDir, "screenshot_render.png");
      await pngBuffer.toFile(pngPath);

      const catalogData = createCatalogData(
        parsedData,
        datFile,
        targetDir,
        indexData
      );

      fs.writeFileSync(
        path.resolve(targetDir, "catalog.json"),
        JSON.stringify(catalogData, null, 2)
      );
      console.log(`Created catalog.json in ${targetDir}`);

      catalogIndex.entries.push({
        catalogId: catalogData.catalogId,
        directory: `${path.relative(CATALOG_DIR, targetDir)}`,
        hasScreenshot: fs.existsSync(pngPath),
        hasThumbnail: fs.existsSync(thumbnailPath),
        hasDatFile: fs.existsSync(targetPath),
        hasCatalogJson: fs.existsSync(path.resolve(targetDir, "catalog.json")),
      });

      fs.writeFileSync(
        CATALOG_INDEX_FILE_PATH,
        JSON.stringify(catalogIndex, null, 2)
      );
      console.log(`Updated catalog_index.json in ${CATALOG_DIR}`);
    }

    console.log(
      "All .dat files have been organized into the catalog directory."
    );
  } catch (error) {
    console.error("Error organizing .dat files:", error.message);
    throw error;
  }
}

(async () => {
  try {
    if (!fs.existsSync(CATALOG_DIR))
      fs.mkdirSync(CATALOG_DIR, { recursive: true });
    await organizeDatFiles();
  } catch (error) {
    console.error("Failed to organize .dat files:", error.message);
  }
})();
