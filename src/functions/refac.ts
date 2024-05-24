import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

if (!OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is not defined in the environment variables."
  );
}

const readFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const writeFile = (filePath: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, "utf8", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const refactorCode = async (
  content: string,
  instructions: string
): Promise<string> => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that refactors code.",
          },
          { role: "user", content: instructions },
          { role: "user", content: content },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Failed to refactor code: ${error.message}`);
  }
};

const recursiveRefactor = async (
  filePath: string,
  instructions: string,
  iterations: number = 5
): Promise<void> => {
  if (iterations === 0) {
    return;
  }

  try {
    const content = await readFile(filePath);
    const refactoredContent = await refactorCode(content, instructions);
    await writeFile(filePath, refactoredContent);
    await recursiveRefactor(filePath, instructions, iterations - 1);
  } catch (error) {
    console.error(`Error during refactor iteration: ${iterations}`, error);
  }
};

// Example usage
const instructions =
  "Please refactor this code for readability, performance, and maintainability.";
const filePath = path.join(
  "C:\\Users\\Aquataze\\Desktop\\node-manic-map-viewer\\src\\functions\\generatePNGFromFiles.ts"
);
recursiveRefactor(filePath, instructions);
