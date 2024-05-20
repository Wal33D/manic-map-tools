import fs from "fs";
import path from "path";
import axios from "axios";
import * as dotenv from "dotenv";
import { parseXmlToJson } from "../utils/parseXmlToJson";
import { camelCaseString } from "../utils/camelCaseString";
import {} from "../utils/parseCatalogXmlToJson";

dotenv.config({ path: ".env.local" });
const baseUrl = "https://archive.org/advancedsearch.php";
const CACHE_FILENAME = "catalog_index.json";
const REQUEST_DELAY = 1500; // Delay between requests in milliseconds
const MAX_RETRIES = 3; // Maximum number of retries for a request

const CATALOG_DIR: string = process.env.MMT_ARCHIVED_CATALOG_DIR;

const ensureDirectoryExists = async (dir: fs.PathLike) => {
  try {
    await fs.promises.stat(dir);
  } catch {
    await fs.promises.mkdir(dir, { recursive: true });
  }
};

const readCacheFile = async (filePath: string): Promise<any> => {
  try {
    const cacheFile = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(cacheFile);
  } catch {
    return { catalog: "Archived", catalogType: "Level", entries: [] };
  }
};

const writeCacheFile = async (filePath: string, data: any) => {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

const saveMetadata = async (
  name: string,
  metadataXml: string,
  files: any[],
  thumbnailUrl: string
) => {
  const camelCasedName = camelCaseString(name);
  const dirPath = path.join(CATALOG_DIR, camelCasedName);
  await ensureDirectoryExists(dirPath);
  const filePath = path.join(dirPath, "catalog.json");

  const metadataJson = await parseCatalogXmlToJson(
    metadataXml,
    dirPath,
    files,
    thumbnailUrl
  );
  await fs.promises.writeFile(
    filePath,
    JSON.stringify(metadataJson, null, 2),
    "utf8"
  );
};

const fetchWithRetries = async (url: string, retries: number = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`Request failed (attempt ${attempt}): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
    }
  }
};

const fetchLevelsData = async (
  queryString = "manic miners"
): Promise<any[]> => {
  await ensureDirectoryExists(CATALOG_DIR);
  const cacheFilePath = path.join(CATALOG_DIR, CACHE_FILENAME);
  let cachedData = await readCacheFile(cacheFilePath);
  const cachedIdentifiers = new Set(
    cachedData.entries.map((entry: any) => entry.catalogId)
  );

  const query = encodeURIComponent(queryString);
  const fields = [
    "title",
    "identifier",
    "creator",
    "date",
    "description",
    "downloads",
  ].join("&fl[]=");
  const fullUrl = `${baseUrl}?q=${query}&fl[]=${fields}&mediatype='software'&rows=99999999&page=1&output=json&callback=callback`;

  try {
    const { data: text } = await fetchWithRetries(fullUrl);
    const jsonp = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
    const data = JSON.parse(jsonp);

    const filteredResults = data.response.docs.filter(
      (doc: { title: string; identifier: string }) =>
        doc.title.toLowerCase().includes("manic") ||
        doc.identifier.toLowerCase().includes("manic")
    );

    for (const doc of filteredResults.filter((doc: { identifier: string }) =>
      doc.identifier.startsWith("ManicMiners-level-")
    )) {
      if (cachedIdentifiers.has(doc.identifier)) continue;

      const levelData = {
        catalog: "Archived",
        catalogType: "Level",
        archived: false,
        pre_release: false,
        catalogId: doc.identifier,
        title: doc.title.split("|")[0].trim() || "No title",
        postedDate: doc.date || "No date",
        author: doc.creator || "No author",
        htmlDescription: doc.description || "No description",
        thumbnail: "",
        screenshot: "",
        metadataUrl: `https://archive.org/download/${doc.identifier}/${doc.identifier}_meta.xml`,
        downloadUrl: "",
        fileListUrl: `https://archive.org/download/${doc.identifier}/${doc.identifier}_files.xml`,
      };

      try {
        const { data: xmlText } = await fetchWithRetries(levelData.fileListUrl);
        const xmlData = parseXmlToJson(xmlText);

        const datFile: any = xmlData.find((file: any) => file.format === "DAT");
        if (datFile)
          levelData.downloadUrl = `https://archive.org/download/${doc.identifier}/${datFile.name}`;

        const thumbnails: any = [];
        const files = xmlData
          .filter((file: any) => {
            if (file.format === "Item Tile" || file.format === "JPEG Thumb") {
              thumbnails.push(file);
              return false;
            }
            return (
              !file.name.endsWith(".torrent") &&
              !file.name.endsWith(".sqlite") &&
              !file.name.endsWith("_meta.xml") &&
              !file.name.endsWith("_files.xml")
            );
          })
          .map((file: any) => ({
            fileName: file.name,
            fileType: file.format,
            fileSize: file.size,
            fileUrl: `https://archive.org/download/${doc.identifier}/${file.name}`,
          }));

        if (thumbnails.length) {
          const largestThumbnail = thumbnails.reduce(
            (prev: { size: string }, current: { size: string }) =>
              parseInt(current.size, 10) > parseInt(prev.size, 10)
                ? current
                : prev
          );
          levelData.thumbnail = `https://archive.org/download/${doc.identifier}/${largestThumbnail.name}`;
        }

        // Fetch metadata XML and save it as JSON with files and thumbnailUrl
        const { data: metadataXml } = await fetchWithRetries(
          levelData.metadataUrl
        );
        await saveMetadata(
          levelData.title,
          metadataXml,
          files,
          levelData.thumbnail
        );

        cachedData.entries.push({
          catalogId: levelData.catalogId,
          directory: camelCaseString(levelData.title),
          hasScreenshot: !!levelData.thumbnail,
          hasThumbnail: !!levelData.thumbnail,
          hasDatFile: !!levelData.downloadUrl,
          hasCatalogJson: true,
        });

        await writeCacheFile(cacheFilePath, cachedData);
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
      } catch (error) {
        console.error(`Error processing ${doc.identifier}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching data from the internet archive:", error);
  }

  return cachedData;
};

const init = async () => {
  const processingResults = await fetchLevelsData("manic miners");
  console.log("Processing results:");
  console.log(processingResults);
};

init();

export { fetchLevelsData };
