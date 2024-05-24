import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import * as dotenv from "dotenv";
import { colors } from "../utils/colorMap";
import { parseMapDataFromFile } from "../fileParser/mapFileParser";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
dotenv.config({ path: ".env.local" });

export interface GenerateThumbnailResult {
  status: boolean;
  filePath: string;
  fileAccessed: boolean;
  parseDataSuccess: boolean;
  wallArrayGenerated: boolean;
  imageBufferCreated: boolean;
  fileSaved: boolean;
  errorDetails?: {
    accessError?: string;
    parseError?: string;
    bufferError?: string;
    saveError?: string;
  };
  imageBuffer?: Buffer;
}
export const generateThumbnailImage = async ({
  filePath,
  outputFileName = "thumbnail_render.png",
}: {
  filePath: string;
  outputFileName?: string;
}): Promise<GenerateThumbnailResult> => {
  let status = false;
  const outputDir = path.dirname(filePath);
  const thumbnailPath = path.join(outputDir, outputFileName);

  let fileAccessed = false;
  let parseDataSuccess = false;
  let wallArrayGenerated = false;
  let imageBufferCreated = false;
  let fileSaved = false;
  const errorDetails: GenerateThumbnailResult["errorDetails"] = {};
  let imageBuffer: Buffer | undefined;

  try {
    await fs.access(thumbnailPath);
    fileAccessed = true;
  } catch (accessError) {
    if ((accessError as NodeJS.ErrnoException).code !== "ENOENT") {
      errorDetails.accessError = (accessError as Error).message;
    }
  }

  try {
    const parsedData = await parseMapDataFromFile({ filePath });
    parseDataSuccess = true;
    const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);
    wallArrayGenerated = true;
    const thumbnail = await createThumbnailBuffer(wallArray);
    imageBufferCreated = true;
    imageBuffer = await sharp(thumbnail).toFile(thumbnailPath);
    fileSaved = true;
    status = true;
  } catch (error: any) {
    if (!parseDataSuccess) errorDetails.parseError = error.message;
    else if (!wallArrayGenerated) errorDetails.bufferError = error.message;
    else if (!imageBufferCreated) errorDetails.bufferError = error.message;
    else errorDetails.saveError = error.message;
  }

  return {
    status,
    filePath: thumbnailPath,
    fileAccessed,
    parseDataSuccess,
    wallArrayGenerated,
    imageBufferCreated,
    fileSaved,
    errorDetails,
  };
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
