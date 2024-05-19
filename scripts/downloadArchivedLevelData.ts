import fs from "fs";
import path from "path";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const CATALOG_DIR: string = process.env.MMT_ARCHIVED_CATALOG_DIR;

const ensureDirectoryExists = async (dir: fs.PathLike) => {
  try {
    await fs.promises.stat(dir);
  } catch {
    await fs.promises.mkdir(dir, { recursive: true });
  }
};

const readJsonFile = async (filePath: string): Promise<any> => {
  try {
    const fileData = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    console.error(`Error reading JSON file at ${filePath}:`, error);
    throw error;
  }
};

const downloadFile = async (fileUrl: string, savePath: string) => {
  try {
    await ensureDirectoryExists(path.dirname(savePath));
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading file from ${fileUrl}:`, error);
  }
};

const processCatalogFile = async (catalogPath: string) => {
  try {
    const catalog = await readJsonFile(catalogPath);
    const parentDir = path.dirname(catalogPath);

    for (const file of catalog.files) {
      let savePath = path.join(parentDir, file.fileName);

      if (
        file.fileUrl.includes("/old/") ||
        file.fileUrl.includes("/old version/")
      ) {
        const ext = path.extname(file.fileName);
        const baseName = path.basename(file.fileName, ext);
        savePath = path.join(parentDir, `${baseName}_old${ext}`);
      } else if (file.fileUrl.includes("/fixed version/")) {
        savePath = path.join(parentDir, file.fileName);
      }

      console.log(`Downloading ${file.fileUrl} to ${savePath}`);
      await downloadFile(file.fileUrl, savePath);
    }

    if (catalog.thumbnailUrl) {
      const thumbnailPath = path.join(
        parentDir,
        path.basename(catalog.thumbnailUrl)
      );
      console.log(
        `Downloading thumbnail ${catalog.thumbnailUrl} to ${thumbnailPath}`
      );
      await downloadFile(catalog.thumbnailUrl, thumbnailPath);
    }
  } catch (error) {
    console.error(`Error processing catalog file at ${catalogPath}:`, error);
  }
};

const traverseAndDownload = async (dir: string) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name.toLowerCase() === "old" ||
        entry.name.toLowerCase() === "old version" ||
        entry.name.toLowerCase() === "fixed version"
      ) {
        continue;
      }
      const catalogPath = path.join(fullPath, "catalog.json");
      if (fs.existsSync(catalogPath)) {
        await processCatalogFile(catalogPath);
      }
      await traverseAndDownload(fullPath);
    }
  }
};

const downloadArchivedLevelData = async () => {
  await ensureDirectoryExists(CATALOG_DIR);
  await traverseAndDownload(CATALOG_DIR);
};

const init = async () => {
  await downloadArchivedLevelData();
};

init();

export { downloadArchivedLevelData };
