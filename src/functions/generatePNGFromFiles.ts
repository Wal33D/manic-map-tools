import * as dotenv from "dotenv";
import path from "path";
import sharp from "sharp";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { colors } from "../utils/colorMap";
import fs from "fs/promises";

dotenv.config({ path: ".env.local" });

interface Color {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

interface Result {
  success: boolean;
  filePath?: string;
  thumbnailPath?: string;
}

const generatePNGFromFile = async (
  filePath: string,
  outputType: "png" | "thumbnail" | "both"
): Promise<Result> => {
  const outputDir = path.dirname(filePath);
  const outputFilePath = path.join(outputDir, "screenshot_render.png");
  const thumbnailPath = path.join(outputDir, "thumbnail_render.png");

  try {
    await fs.access(outputFilePath);
    console.log("File already exists:", outputFilePath);
    return { success: true, filePath: outputFilePath };
  } catch {
    // File does not exist, continue to process
  }

  try {
    const parsedData = await parseMapDataFromFile({ filePath });
    const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);

    if (["png", "both"].includes(outputType)) {
      const image = await generatePNG(wallArray, parsedData.biome);
      await image.toFile(outputFilePath);
      console.log(`Image saved as ${outputFilePath}`);
    }

    if (["thumbnail", "both"].includes(outputType)) {
      const thumbnail = await generateThumbnail(wallArray);
      await sharp(thumbnail).toFile(thumbnailPath);
      console.log(`Thumbnail saved as ${thumbnailPath}`);
    }

    return {
      success: true,
      filePath: outputType !== "thumbnail" ? outputFilePath : undefined,
      thumbnailPath: outputType !== "png" ? thumbnailPath : undefined,
    };
  } catch (error) {
    console.error("Error processing file:", filePath, error);
    return { success: false, filePath: outputFilePath };
  }
};

const generatePNGFromFiles = async (
  filePaths: string[] | string,
  outputType: "png" | "thumbnail" | "both"
): Promise<Result[]> => {
  const files = Array.isArray(filePaths) ? filePaths : [filePaths];
  return Promise.all(files.map(filePath => generatePNGFromFile(filePath, outputType)));
};

const findAllDatFiles = async (dir: string): Promise<string[]> => {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findAllDatFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".dat")) {
      results.push(fullPath);
    }
  }

  return results;
};

const processDirectory = async (
  datDirectory: string,
  outputType: "png" | "thumbnail" | "both"
): Promise<Result[]> => {
  const datFiles = await findAllDatFiles(datDirectory);
  return generatePNGFromFiles(datFiles, outputType);
};

const generatePNG = async (wallArray: number[][], biome = "default") => {
  const scale = 17;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");

  return adjustImage(buffer, 1280, 1080, 25, biome);
};

const generateThumbnail = async (wallArray: number[][]) => {
  const scale = 5;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapThumbTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");

  return sharp(buffer)
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0.1 },
    })
    .toBuffer();
};

const drawMapThumbTiles = async (
  ctx: CanvasRenderingContext2D,
  wallArray: number[][],
  scale: number
) => {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
      drawThumbTile(ctx, x, y, scale, color);
    }
  }
};

const drawThumbTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: { r: number; g: number; b: number; a: number }
) => {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.fillRect(x * scale, y * scale, scale, scale);
};

const drawMapTiles = async (
  ctx: CanvasRenderingContext2D,
  wallArray: number[][],
  scale: number
) => {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || colors.default;
      drawTile(ctx, x, y, scale, color, tile);
    }
  }
};

const drawTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: Color,
  tile: number
) => {
  const fallbackColor: Color = { r: 255, g: 0, b: 0, alpha: 1 };
  const { r, g, b, alpha } = { ...fallbackColor, ...color };

  if (!color) {
    console.warn(`Undefined color for tile: ${tile}`);
  }

  const patternCanvas = createCanvas(scale, scale);
  const patternCtx = patternCanvas.getContext("2d");

  // Create gradient and fill pattern
  const tileGradient = patternCtx.createLinearGradient(0, 0, scale, scale);
  tileGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  tileGradient.addColorStop(
    1,
    `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(
      0,
      b - 20
    )}, ${alpha})`
  );
  patternCtx.fillStyle = tileGradient;
  patternCtx.fillRect(0, 0, scale, scale);

  // Draw tile lines for texture effect
  patternCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  patternCtx.lineWidth = 1;
  for (let k = 0; k < scale; k += 5) {
    patternCtx.beginPath();
    patternCtx.moveTo(k, 0);
    patternCtx.lineTo(0, k);
    patternCtx.moveTo(scale, k);
    patternCtx.lineTo(k, scale);
    patternCtx.moveTo(k, scale);
    patternCtx.lineTo(scale, k);
    patternCtx.stroke();
  }

  // Configure shadow effects
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Fill main canvas with patterned tile
  const pattern = ctx.createPattern(patternCanvas, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(x * scale, y * scale, scale, scale);

  // Draw border around tile
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.moveTo(x * scale, y * scale + scale);
  ctx.lineTo(x * scale, y * scale);
  ctx.lineTo(x * scale + scale, y * scale);
  ctx.stroke();

  // Reset shadow effects
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const create2DArray = (data: number[], width: number): number[][] =>
  Array.from({ length: Math.ceil(data.length / width) }, (_v, i) =>
    data.slice(i * width, i * width + width)
  );

const adjustImage = async (
  buffer: sharp.SharpOptions | Buffer | any,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  biome: string
): Promise<sharp.Sharp> => {
  let image = sharp(buffer).sharpen();
  image = await image.resize(
    frameWidth - 2 * padding,
    frameHeight - 2 * padding,
    {
      fit: "inside",
      withoutEnlargement: true,
    }
  );

  image = await image.extend({
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
    background: colors[biome.toLowerCase()] || colors.default,
  });

  const metadata = await image.metadata();
  if (metadata.width > metadata.height) {
    image = image.rotate(90);
  }

  return image;
};

export const initProcess = async (
  outputType: "png" | "thumbnail" | "both"
): Promise<{ message: string; processedCount: number; errors: boolean }> => {
  const directoryPath = process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (!directoryPath) {
    const message = "HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local";
    console.error(message);
    return {
      message,
      processedCount: 0,
      errors: true,
    };
  }

  try {
    const processingResults = await processDirectory(directoryPath, outputType);
    const processedCount = processingResults.filter(
      (result) => result.success
    ).length;
    const message = "Processing completed";
    console.log(processingResults);
    return { message, processedCount, errors: false };
  } catch (error) {
    console.error("Error processing directory:", error);
    return {
      message: "Error processing directory",
      processedCount: 0,
      errors: true,
    };
  }
};