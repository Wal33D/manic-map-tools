import * as fs from "fs";
import * as path from "path";
import * as chardet from "chardet";
import * as iconv from "iconv-lite";
import * as os from "os";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function cleanKey(key: string, filePath: string): string {
  if (key.toLowerCase() === "rowcount" || key.toLowerCase() === "colcount") {
    console.error(
      `[WARNING] Found key with uppercase letters: ${key} --> in file: ${filePath}`
    );
    return key.toLowerCase();
  }
  return key;
}

const cleanMapFile = (filePath: string): void => {
  const encoding = chardet.detectFileSync(filePath) || "utf8";
  console.log(`Detected file encoding: ${encoding}`);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`[ERROR] Error reading file ${filePath}:`, err);
      return;
    }

    const fileContent = iconv.decode(data, encoding as BufferEncoding);

    const cleanFileContent = (content: string): string => {
      const printableContent = content.replace(/[^\x20-\x7E\n\r]/g, "");
      const cleanedContent = printableContent
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      return cleanedContent
        .split("\n")
        .map((line) => {
          const keyValue = line.split(":");
          if (keyValue.length === 2) {
            const key = keyValue[0].trim();
            const value = keyValue[1].trim();
            return `${cleanKey(key, filePath)}: ${value}`;
          }
          return line;
        })
        .join("\n");
    };

    const cleanedData = cleanFileContent(fileContent);

    const backupFilePath = `${filePath}.bak`;
    fs.rename(filePath, backupFilePath, (renameErr) => {
      if (renameErr) {
        console.error(
          `[ERROR] Error renaming file ${filePath} to ${backupFilePath}:`,
          renameErr
        );
        return;
      }

      fs.writeFile(filePath, iconv.encode(cleanedData, "utf8"), (writeErr) => {
        if (writeErr) {
          console.error(
            `[ERROR] Error writing cleaned content to ${filePath}:`,
            writeErr
          );
          return;
        }
        console.log(
          `[INFO] Cleaned file content saved to ${filePath} for inspection.`
        );

        const extractTilesArray = (content: string): number[] | null => {
          try {
            const tilesMatch = content.match(/tiles\s*\{\s*([^}]*)\s*\}/);
            if (tilesMatch) {
              const tilesString = tilesMatch[1];
              const tilesArray = tilesString
                .split(/[\s,]+/)
                .map((num) => num.trim())
                .filter((num) => num.length > 0 && num !== "-")
                .map((num) => parseInt(num, 10))
                .filter((num) => !isNaN(num));
              return tilesArray;
            }
            return null;
          } catch (error) {
            console.error(`[ERROR] Error extracting tiles array:`, error);
            return null;
          }
        };

        const tilesArray = extractTilesArray(cleanedData);
        if (tilesArray) {
          console.log(
            `[INFO] Successfully extracted and parsed tiles from ${filePath}`
          );
        } else {
          console.log(`[FAIL] Failed to extract tiles from file: ${filePath}`);
        }
      });
    });
  });
};

const getDatFiles = (dirPath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        return reject(`[ERROR] Error reading directory ${dirPath}: ${err}`);
      }

      const datFiles = files.filter((file) => {
        const filePath = path.join(dirPath, file);
        return (
          fs.statSync(filePath).isFile() && path.extname(filePath) === ".dat"
        );
      });

      resolve(datFiles.map((file) => path.join(dirPath, file)));
    });
  });
};

const processDatFiles = (filePaths: string[]): void => {
  filePaths.forEach(cleanMapFile);
};

async function init() {
  try {
    const directoryPath =
      process.env.MMT_CLEANME_DIR ||
      path.join(os.homedir(), "Desktop", "discordChannelBot", "cleanme");

    const datFiles = await getDatFiles(directoryPath);

    if (datFiles.length === 0) {
      console.log("[INFO] No .dat files found to process.");
      rl.close();
      return;
    }

    console.log(`\nFiles to be processed:\n${datFiles.join("\n")}\n`);
    rl.question(
      `There are ${datFiles.length} files to process. Would you like to proceed? (yes/no): \n`,
      (answer) => {
        if (answer.toLowerCase() === "yes") {
          processDatFiles(datFiles);
        } else {
          console.log("[INFO] Process aborted by user.");
        }
        rl.close();
      }
    );
  } catch (err) {
    console.error("[ERROR] Error initializing clean map files:", err);
  }
}

init();
