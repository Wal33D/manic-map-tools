import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CLUSTER = process.env.DB_CLUSTER;
const DATABASE_NAME = process.env.DATABASE_NAME || "levelsCatalogDB";
const DOWNLOAD_DIR: any = process.env.HOGNOSE_LEVELS_TEST_DL_DIR;

if (!DB_USERNAME || !DB_PASSWORD || !DB_CLUSTER || !DOWNLOAD_DIR) {
  console.error(
    "Error: DB_USERNAME, DB_PASSWORD, DB_CLUSTER, HOGNOSE_LEVELS_TEST_DL_DIR, and COLLECTION_NAME must be set in the .env.local file."
  );
  process.exit(1);
}

const MONGODB_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}${DB_CLUSTER}/${DATABASE_NAME}?retryWrites=true&w=majority`;

async function downloadCollectionFromMongoDB(collectionName = "Hognose") {
  const client = new MongoClient(MONGODB_URI, {});

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(collectionName);

    console.log(`Downloading documents from collection: ${collectionName}`);
    const documents = await collection.find().toArray();

    for (const doc of documents) {
      const levelDir = path.join(DOWNLOAD_DIR, doc.levelName);
      if (!fs.existsSync(levelDir)) {
        fs.mkdirSync(levelDir, { recursive: true });
      }

      for (const file of doc.files) {
        if (file.type === "file" && file.content) {
          const filePath = path.join(levelDir, file.name);
          fs.writeFileSync(filePath, Buffer.from(file.content, "base64"));
          console.log(`File written: ${filePath}`);
        }
      }
    }

    console.log("Download completed successfully.");
  } catch (error) {
    console.error("Error downloading from MongoDB:", error.message);
  } finally {
    await client.close();
  }
}

downloadCollectionFromMongoDB("Hognose");
