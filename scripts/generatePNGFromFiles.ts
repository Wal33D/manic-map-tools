import * as dotenv from "dotenv";
import path from "path";
import sharp from "sharp";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { Color } from "../src/types/types";
import { colors } from "../src/functions/colorMap";
dotenv.config({ path: ".env.local" });

const fs = require("fs").promises;

export async function generatePNGFromFiles(
  filePaths: string[] | string
): Promise<{ success: boolean; filePath: string; thumbnailPath?: string }[]> {
  const files = Array.isArray(filePaths) ? filePaths : [filePaths];
  const results = [];

  for (const filePath of files) {
    const outputDir = path.dirname(filePath);
    const outputFilePath = path.join(outputDir, "screenshot_render.png");
    const thumbnailPath = path.join(outputDir, "thumbnail_render.png");

    try {
      await fs.access(outputFilePath);
      console.log("File already exists:", outputFilePath);
      results.push({ success: true, filePath: outputFilePath });
      continue;
    } catch {}

    try {
      const parsedData = await parseMapDataFromFile({ filePath });
      const wallArray = create2DArray({
        data: parsedData.tilesArray,
        width: parsedData.colcount,
      });

      const image = await generatePNG(wallArray, parsedData.biome);
      await image.toFile(outputFilePath);

      const thumbnail = await generateThumbnail(wallArray);
      await sharp(thumbnail).toFile(thumbnailPath);

      console.log(
        `Image and thumbnail saved as ${outputFilePath} and ${thumbnailPath}`
      );
      results.push({ success: true, filePath: outputFilePath, thumbnailPath });
    } catch (error) {
      console.error("Error processing file:", filePath, error);
      results.push({ success: false, filePath: outputFilePath });
    }
  }

  return results;
}

async function findAllDatFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await findAllDatFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".dat")) {
      results.push(fullPath);
    }
  }

  return results;
}

export async function processDirectory(datDirectory: string) {
  const datFiles = await findAllDatFiles(datDirectory);
  return await generatePNGFromFiles(datFiles);
}

export async function test() {
  const directoryPath = process.env.HOGNOSE_MAP_CATALOG_DIR;
  if (directoryPath) {
    const processingResults = await processDirectory(directoryPath);
    console.log(processingResults);
  } else {
    console.error("HOGNOSE_MAP_CATALOG_DIR is not defined in .env.local");
  }
}

// generatePNG.ts
export async function generatePNG(
  wallArray: string | any[],
  biome = "default"
) {
  const scale = 17;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameWidth = 1280;
  const frameHeight = 1080;
  const padding = 25;

  const image = await processImage(
    buffer,
    frameWidth,
    frameHeight,
    padding,
    biome
  );

  const finalCanvas = await image.toBuffer();

  return await sharp(finalCanvas).resize(1280, 1280, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0.1 },
  });
}

// generateThumbnail.ts
export async function generateThumbnail(wallArray: string | any[]) {
  const scale = 5;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapThumbTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");

  return await sharp(buffer)
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0.1 },
    })
    .toBuffer();
}

async function drawMapThumbTiles(
  ctx: CanvasRenderingContext2D,
  wallArray: string | any[],
  scale: number
) {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
      drawThumbTile(ctx, x, y, scale, color);
    }
  }
}

function drawThumbTile(
  ctx: CanvasRenderingContext2D,
  y: number,
  x: number,
  scale: number,
  color: { r: number; g: number; b: number; a: number }
) {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}

// drawMapTiles.ts
export async function drawMapTiles(
  ctx: CanvasRenderingContext2D,
  wallArray: string | any[],
  scale: number
) {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || colors.default;
      drawTile(ctx, x, y, scale, color);
    }
  }
}

// drawTile.ts
export function drawTile(
  ctx: CanvasRenderingContext2D,
  i: number,
  j: number,
  scale: number,
  color: Color
) {
  const patternCanvas = createCanvas(scale, scale);
  const patternCtx = patternCanvas.getContext("2d");

  const tileGradient = patternCtx.createLinearGradient(0, 0, scale, scale);
  tileGradient.addColorStop(
    0,
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`
  );
  tileGradient.addColorStop(
    1,
    `rgba(${Math.max(0, color.r - 20)}, ${Math.max(
      0,
      color.g - 20
    )}, ${Math.max(0, color.b - 20)}, ${color.alpha})`
  );
  patternCtx.fillStyle = tileGradient;
  patternCtx.fillRect(0, 0, scale, scale);

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

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  const pattern = ctx.createPattern(patternCanvas, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(j * scale, i * scale, scale, scale);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.moveTo(j * scale, i * scale + scale);
  ctx.lineTo(j * scale, i * scale);
  ctx.lineTo(j * scale + scale, i * scale);
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// create2DArray.ts
export function create2DArray({
  data,
  width,
}: {
  data: number[];
  width: number;
}): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < data.length; i += width) {
    result.push(data.slice(i, i + width));
  }
  return result;
}

// processImage.ts
export async function processImage(
  buffer: sharp.SharpOptions | Buffer | any,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  biome: string
) {
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
}
