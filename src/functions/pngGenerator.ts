import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import * as dotenv from "dotenv";
import { Color } from "../types";
import { colors } from "../utils/colorMap";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { createCanvas, CanvasRenderingContext2D } from "canvas";

dotenv.config({ path: ".env.local" });

export const generatePNGImage = async ({
  filePath,
  outputFileName = "screenshot_render.png",
}: {
  filePath: string;
  outputFileName?: string;
}): Promise<any> => {
  const outputDir = path.dirname(filePath);
  const screenshotFilePath = path.join(outputDir, outputFileName);

  try {
    await fs.access(screenshotFilePath);
    console.log("File already exists:", screenshotFilePath);
    return { success: true, filePath: screenshotFilePath };
  } catch {}

  try {
    const parsedData = await parseMapDataFromFile({ filePath });
    const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);

    const imageBuffer = await createPNGImageBuffer(wallArray, parsedData.biome);
    await sharp(imageBuffer).toFile(screenshotFilePath);
    console.log(`Image saved as ${screenshotFilePath}`);

    return { success: true, filePath: screenshotFilePath, imageBuffer };
  } catch (error) {
    console.error("Error processing file:", filePath, error);
    return { success: false, filePath: screenshotFilePath };
  }
};

const createPNGImageBuffer = async (
  wallArray: number[][],
  biome = "default"
) => {
  const scale = 17;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await renderMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameWidth = 1280;
  const frameHeight = 1080;
  const padding = 25;

  const image = await processImageBuffer(
    buffer,
    frameWidth,
    frameHeight,
    padding,
    biome
  );
  const finalCanvas = await image.toBuffer();

  return await sharp(finalCanvas)
    .resize(1280, 1280, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0.1 },
    })
    .toBuffer();
};

const renderMapTiles = async (
  ctx: CanvasRenderingContext2D,
  wallArray: number[][],
  scale: number
) => {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || colors.default;
      drawMapTile(ctx, x, y, scale, color, tile);
    }
  }
};

const drawMapTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: Color,
  tile: number
) => {
  const fallbackColor: Color = { r: 255, g: 0, b: 0, alpha: 1 };
  const {
    r = fallbackColor.r,
    g = fallbackColor.g,
    b = fallbackColor.b,
    alpha = fallbackColor.alpha,
  } = color || {};

  if (color === undefined) {
    console.warn(`Undefined color for tile: ${tile}`);
  }

  const patternCanvas = createCanvas(scale, scale);
  const patternCtx = patternCanvas.getContext("2d");

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
  ctx.fillRect(x * scale, y * scale, scale, scale);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.moveTo(x * scale, y * scale + scale);
  ctx.lineTo(x * scale, y * scale);
  ctx.lineTo(x * scale + scale, y * scale);
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const create2DArray = (data: number[], width: number): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < data.length; i += width) {
    result.push(data.slice(i, i + width));
  }
  return result;
};

const processImageBuffer = async (
  buffer: sharp.SharpOptions | Buffer | any,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  biome: string
) => {
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
  //@ts-ignore
  if (metadata.width > metadata.height) {
    image = image.rotate(90);
  }

  return image;
};
