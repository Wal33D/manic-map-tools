/**
 * This script fetches the latest procedurally generated levels from the Hognose project
 * and extracts only the .dat files to a specified directory. It downloads the latest
 * release zip file from the Hognose GitHub repository, ensures necessary directories
 * are created, and logs relevant information.
 *
 * All LevelPak files are credited to the Hognose project by charredUtensil.
 * GitHub Repository: https://github.com/charredUtensil/hognose
 *
 * The creator, charredUtensil, has made a set of 256 procedurally generated levels
 * for the game Manic Miners available for free. We decided to include them in our
 * level indexing system to enhance our collection and provide more content.
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const GITHUB_API_URL =
  "https://api.github.com/repos/charredUtensil/hognose/releases/latest";
const DOWNLOAD_DIR = process.env.HOGNOSE_LEVELS_DOWNLOAD_DIR;

if (!DOWNLOAD_DIR) {
  console.error(
    "Error: HOGNOSE_LEVELS_DOWNLOAD_DIR must be set in the .env file."
  );
  process.exit(1);
}

const ZIP_FILE_NAME = "levelpak.zip";
const INDEX_FILE_NAME = "hognose_index.json";
const INDEX_FILE_PATH = path.resolve(DOWNLOAD_DIR, INDEX_FILE_NAME);

async function fetchHognoseMaps() {
  try {
    console.log("Starting fetchHognoseMaps function...");

    console.log(`Fetching the latest release from: ${GITHUB_API_URL}`);
    const response = await axios.get(GITHUB_API_URL);
    const releaseInfo = response.data;
    const assets = releaseInfo.assets;
    const levelPak = assets.find(
      (asset: { name: string }) => asset.name === ZIP_FILE_NAME
    );

    if (!levelPak) {
      throw new Error(`${ZIP_FILE_NAME} not found in the latest release.`);
    }

    const downloadUrl = levelPak.browser_download_url;
    const zipFilePath = path.resolve(DOWNLOAD_DIR, ZIP_FILE_NAME);
    const writer = fs.createWriteStream(zipFilePath);

    console.log(`Downloading the file from: ${downloadUrl}`);
    const { data } = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
    });

    data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`${ZIP_FILE_NAME} downloaded successfully to ${DOWNLOAD_DIR}`);
    console.log(
      `Credits to charredUtensil for creating the Hognose project. Repository: https://github.com/charredUtensil/hognose`
    );

    let datFiles = [] as any;
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Parse())
      .on("entry", async (entry) => {
        const fileName = entry.path;
        const type = entry.type;
        const isDatFile = fileName.endsWith(".dat");
        if (type === "File" && isDatFile) {
          const outputPath = path.resolve(
            DOWNLOAD_DIR,
            path.basename(fileName)
          );
          entry.pipe(fs.createWriteStream(outputPath));
          datFiles.push(path.basename(fileName));
        } else {
          entry.autodrain();
        }
      })
      .promise();

    console.log(`Extracted .dat files: ${datFiles}`);

    const indexData = {
      version: releaseInfo.tag_name,
      downloadedAt: new Date().toISOString(),
      repository: "https://github.com/charredUtensil/hognose",
      datFiles: datFiles,
    };

    fs.writeFileSync(INDEX_FILE_PATH, JSON.stringify(indexData, null, 2));

    fs.unlinkSync(zipFilePath);

    console.log(`.dat files extracted: ${datFiles.length}`);
    console.log(`${ZIP_FILE_NAME} has been deleted after extraction.`);
    console.log(
      `hognose_index.json created with release version, download date, repository URL, and list of .dat files.`
    );
  } catch (error) {
    console.error("Error fetching and extracting .dat files:", error.message);
    throw error;
  }
}

async function checkForUpdate() {
  try {
    console.log("Starting checkForUpdate function...");

    if (fs.existsSync(INDEX_FILE_PATH)) {
      console.log("hognose_index.json exists, reading file...");
      const indexData = JSON.parse(fs.readFileSync(INDEX_FILE_PATH, "utf8"));
      const response = await axios.get(GITHUB_API_URL);
      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name;

      if (indexData.version !== latestVersion) {
        console.log(
          `New version detected: ${latestVersion}. Clearing directory and downloading new files.`
        );
        fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
        await fetchHognoseMaps();
      } else {
        const datFiles = fs
          .readdirSync(DOWNLOAD_DIR)
          .filter((file) => file.endsWith(".dat"));
        if (datFiles.length !== indexData.datFiles.length) {
          console.log("Mismatch in .dat file count. Redownloading files.");
          fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
          fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
          await fetchHognoseMaps();
        } else {
          console.log("No updates needed. The .dat files are up to date.");
        }
      }
    } else {
      console.log(
        "hognose_index.json does not exist, performing initial download..."
      );
      await fetchHognoseMaps();
    }
  } catch (error) {
    console.error("Error checking for updates:", error.message);
    throw error;
  }
}

(async () => {
  try {
    console.log("Starting script...");

    if (!fs.existsSync(DOWNLOAD_DIR)) {
      console.log(`Creating download directory: ${DOWNLOAD_DIR}`);
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }

    await checkForUpdate();

    console.log("Script completed successfully.");
  } catch (error) {
    console.error(
      "Failed to check for updates and fetch .dat files:",
      error.message
    );
  }
})();
