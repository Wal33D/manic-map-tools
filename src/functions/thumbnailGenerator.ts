import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import * as dotenv from "dotenv";
import { colors } from "../utils/colorMap";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
dotenv.config({ path: ".env.local" });

export const generateThumbnailImage = async ({
  filePath,
  outputFileName = "thumbnail_render.png",
}: {
  filePath: string;
  outputFileName?: string;
}): Promise<any> => {
  let status = false;
  const outputDir = path.dirname(filePath);
  const thumbnailPath = path.join(outputDir, outputFileName);

  try {
    await fs.access(thumbnailPath);
    status = true;
    return { status, thumbnailPath };
  } catch (accessError) {
    // Continue to generate thumbnail
  }

  try {
    const parsedData = await parseMapDataFromFile({ filePath });
    const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);
    const thumbnail = await createThumbnailBuffer(wallArray);
    await sharp(thumbnail).toFile(thumbnailPath);
    status = true;
  } catch (error: any) {}

  return { status, thumbnailPath };
};

const createThumbnailBuffer = async (wallArray: number[][]) => {
  const scale = 5;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await renderThumbnailTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");

  return await sharp(buffer)
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0.1 },
    })
    .toBuffer();
};

const renderThumbnailTiles = async (
  ctx: CanvasRenderingContext2D,
  wallArray: number[][],
  scale: number
) => {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
      drawThumbnailTile(ctx, x, y, scale, color);
    }
  }
};

const drawThumbnailTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: { r: number; g: number; b: number; a: number }
) => {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.fillRect(x * scale, y * scale, scale, scale);
};

const create2DArray = (data: number[], width: number): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < data.length; i += width) {
    result.push(data.slice(i, i + width));
  }
  return result;
};
