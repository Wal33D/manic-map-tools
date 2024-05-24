import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER = process.env.DB_CLUSTER;
const DATABASE_NAME = process.env.DATABASE_NAME || "levelsCatalogDB";

const ROOT_DIRECTORY_PATH = process.env.HOGNOSE_LEVELS_CATALOG_DIR;

if (!DB_USERNAME || !DB_PASSWORD || !DB_CLUSTER || !ROOT_DIRECTORY_PATH) {
  console.error(
    "Error: DB_USERNAME, DB_PASSWORD, DB_CLUSTER, and HOGNOSE_LEVELS_CATALOG_DIR must be set in the .env.local file."
  );
  process.exit(1);
}

const MONGODB_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}${DB_CLUSTER}/${DATABASE_NAME}?retryWrites=true&w=majority`;

async function uploadAllCatalogsToMongoDB() {
  const client = new MongoClient(MONGODB_URI, {});

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db(DATABASE_NAME);

    console.log(`Traversing directory: ${ROOT_DIRECTORY_PATH}`);
    const catalogDirs = findCatalogDirectories(ROOT_DIRECTORY_PATH);

    for (const catalogDir of catalogDirs) {
      const catalogIndexFilePath = path.join(catalogDir, "catalog_index.json");
      const catalogIndex = JSON.parse(
        fs.readFileSync(catalogIndexFilePath, "utf8")
      );
      const collectionName = catalogIndex.catalog;

      if (!collectionName) {
        console.error(
          `Catalog name not found in the catalog index file at ${catalogIndexFilePath}. Skipping...`
        );
        continue;
      }

      const collection = db.collection(collectionName);

      // Ensure unique index on levelName field
      await collection.createIndex({ levelName: 1 }, { unique: true });

      console.log(
        `Uploading directory: ${catalogDir} to collection: ${collectionName}`
      );
      await traverseAndUpload(catalogDir, collection);

      console.log(`Upload completed for directory: ${catalogDir}`);
    }

    console.log("All catalogs have been uploaded successfully.");
  } catch (error) {
    if (error.code === 11000) {
      console.error("Duplicate entry found. Skipping upload.");
    } else {
      console.error("Error uploading to MongoDB:", error.message);
    }
  } finally {
    await client.close();
  }
}

function findCatalogDirectories(directoryPath: string): string[] {
  const catalogDirs = [] as any;

  function recurseDirs(currentPath: string) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const catalogIndexPath = path.join(itemPath, "catalog_index.json");
        if (fs.existsSync(catalogIndexPath)) {
          catalogDirs.push(itemPath);
        } else {
          recurseDirs(itemPath); // Recurse into subdirectories
        }
      }
    }
  }

  recurseDirs(directoryPath);
  return catalogDirs;
}

async function traverseAndUpload(directoryPath: string, collection: any) {
  const items = fs.readdirSync(directoryPath);

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      console.log(`Uploading level directory: ${itemPath}`);
      const levelDocuments = await processLevelDirectory(itemPath);

      // Check for duplicate before inserting
      const existingDocument = await collection.findOne({ levelName: item });
      if (!existingDocument) {
        await collection.insertOne({
          levelName: item,
          files: levelDocuments,
        });
        console.log(`Uploaded level: ${item}`);
      } else {
        console.log(`Skipping duplicate level: ${item}`);
      }
    }
  }
}

async function processLevelDirectory(directoryPath: string) {
  const items = fs.readdirSync(directoryPath);
  const levelDocuments = [] as any;

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isFile()) {
      console.log(`Processing file: ${itemPath}`);
      const fileContent = fs.readFileSync(itemPath);

      levelDocuments.push({
        type: "file",
        name: item,
        content: fileContent.toString("base64"), // Store file content as Base64
      });
    }
  }

  return levelDocuments;
}

uploadAllCatalogsToMongoDB();
