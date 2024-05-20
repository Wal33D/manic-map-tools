import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config({ path: ".env.local" });

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER = process.env.DB_CLUSTER;
const DATABASE_NAME = process.env.DATABASE_NAME || "levelsCatalogDB";
const DIRECTORY_PATH = process.env.HOGNOSE_LEVELS_CATALOG_DIR;

if (!DB_USERNAME || !DB_PASSWORD || !DB_CLUSTER || !DIRECTORY_PATH) {
  console.error(
    "Error: DB_USERNAME, DB_PASSWORD, DB_CLUSTER, and HOGNOSE_LEVELS_CATALOG_DIR must be set in the .env.local file."
  );
  process.exit(1);
}

const MONGODB_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}${DB_CLUSTER}/${DATABASE_NAME}?retryWrites=true&w=majority`;

async function uploadDirectoryToMongoDB() {
  const client = new MongoClient(MONGODB_URI, {});

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db(DATABASE_NAME);

    console.log(`Uploading directory: ${DIRECTORY_PATH}`);
    await traverseAndUpload(DIRECTORY_PATH, db);

    console.log("Upload completed successfully.");
  } catch (error) {
    console.error("Error uploading to MongoDB:", error.message);
  } finally {
    await client.close();
  }
}

async function traverseAndUpload(directoryPath: string, db: any) {
  const items = fs.readdirSync(directoryPath);

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      console.log(`Creating collection for directory: ${itemPath}`);
      const collection = db.collection(item); // Create a new collection for each level directory

      await traverseAndUpload(itemPath, db);
    } else {
      const collectionName = path.basename(path.dirname(itemPath));
      const collection = db.collection(collectionName);

      console.log(`Uploading file: ${itemPath}`);
      const fileContent = fs.readFileSync(itemPath);

      await collection.insertOne({
        type: "file",
        path: itemPath,
        name: item,
        content: fileContent.toString("base64"), // Store file content as Base64
      });
    }
  }
}

uploadDirectoryToMongoDB();
