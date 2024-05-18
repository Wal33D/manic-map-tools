import sharp from "sharp";
import { createCanvas } from "canvas";
import { drawMapTiles } from "./drawMapTiles";

export async function generatePNG(
  wallArray: number[][],
  biome = "default"
): Promise<sharp.Sharp> {
  const scale = 30;
  const height = wallArray.length;
  const width = wallArray[0].length;

  let canvas = createCanvas(width * scale, height * scale);
  let ctx = canvas.getContext("2d");

  // Draw the map tiles initially
  await drawMapTiles(ctx, wallArray, scale);
  let buffer = canvas.toBuffer("image/png");

  const image = sharp(buffer);
  const finalBuffer = await image.toBuffer();

  return sharp(finalBuffer);
}
