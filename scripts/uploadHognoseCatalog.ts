import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
require("dotenv").config();

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER = process.env.DB_CLUSTER;
const DATABASE_NAME = process.env.DATABASE_NAME || "hognoseCatalogDB";
const COLLECTION_NAME = "hognoseCatalog";
const DIRECTORY_PATH = process.env.HOGNOSE_LEVELS_CATALOG_DIR;

if (!DB_USERNAME || !DB_PASSWORD || !DB_CLUSTER) {
  console.error(
    "Error: DB_USERNAME, DB_PASSWORD, and DB_CLUSTER must be set in the .env file."
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
    const collection = db.collection(COLLECTION_NAME);

    console.log(`Uploading directory: ${DIRECTORY_PATH}`);
    await traverseAndUpload(DIRECTORY_PATH, collection);

    console.log("Upload completed successfully.");
  } catch (error) {
    console.error("Error uploading to MongoDB:", error.message);
  } finally {
    await client.close();
  }
}

async function traverseAndUpload(directoryPath: string, collection: any) {
  const items = fs.readdirSync(directoryPath);

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      console.log(`Uploading directory: ${itemPath}`);
      await collection.insertOne({
        type: "directory",
        path: itemPath,
        name: item,
        children: [],
      });

      await traverseAndUpload(itemPath, collection);
    } else {
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
