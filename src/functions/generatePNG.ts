import sharp from "sharp";
import { colors } from "./colorMap";
import { createCanvas } from "canvas";
import { drawMapTiles } from "./drawMapTiles";

async function processImage(
  buffer: sharp.SharpOptions | Buffer | any,
  height: number,
  width: number,
  scale: number,
  frameSize: number,
  padding: number,
  biome: string
) {
  let image = sharp(buffer).sharpen();

  // Resize the image first
  const maxDimension = Math.max(height * scale, width * scale);
  image = await image.resize({
    width: width * scale > height * scale ? frameSize - 2 * padding : null,
    height: height * scale >= width * scale ? frameSize - 2 * padding : null,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Rotate the image if the height is greater than the width
  if (height * scale > width * scale) {
    image = image.rotate(90);
  }

  return image.extend({
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
    background: colors[biome.toLowerCase()] || {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0.31,
    },
  });
}

export async function generatePNG(
  wallArray: number[][],
  biome = "default"
): Promise<sharp.Sharp> {
  const scale = 30;
  const height = wallArray.length;
  const width = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameSize = 1024;
  const padding = 50;

  const image = await processImage(
    buffer,
    height,
    width,
    scale,
    frameSize,
    padding,
    biome
  );
  const finalCanvas = await image.toBuffer();

  return sharp(finalCanvas);
}
