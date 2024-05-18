import * as fs from "fs/promises";
import * as path from "path";

async function minifyDirectory(
  baseDir: string,
  ignoreList: string[] = []
): Promise<any> {
  let directoryStructure: any = {};

  async function traverseDirectory(
    currentPath: string,
    structure: any
  ): Promise<void> {
    const directoryContents = await fs.readdir(currentPath, {
      withFileTypes: true,
    });
    for (const dirent of directoryContents) {
      if (ignoreList.includes(dirent.name)) continue;
      const fullPath = path.join(currentPath, dirent.name);
      if (dirent.isDirectory()) {
        console.log(`Directory: ${fullPath}`);
        structure[dirent.name] = {};
        await traverseDirectory(fullPath, structure[dirent.name]);
      } else {
        console.log(`File: ${fullPath}`);
        const fileContent = await fs.readFile(fullPath, "utf8");
        const minifiedContent = fileContent.replace(/\s+/g, " ").trim();
        structure[dirent.name] = {
          content: minifiedContent,
          originalSize: fileContent.length,
          minifiedSize: minifiedContent.length,
        };
      }
    }
  }

  await traverseDirectory(baseDir, directoryStructure);
  return directoryStructure;
}

async function init() {
  try {
    const baseDir = process.cwd();
    const ignoreList = [
      "dist",
      "assets",
      "node_modules",
      ".vscode",
      "package-lock.json",
    ];
    const result = await minifyDirectory(baseDir, ignoreList);

    console.log("========== Directory Structure ==========");
    console.log(JSON.stringify(result, null, 2));
    console.log("=========================================");

    await fs.writeFile(
      "directory_structure.json",
      JSON.stringify(result, null, 2)
    );
    console.log(
      "[INFO] Directory structure has been written to directory_structure.json"
    );
  } catch (err) {
    console.error("[ERROR] Error minifying directory:", err);
  }
}

init();
