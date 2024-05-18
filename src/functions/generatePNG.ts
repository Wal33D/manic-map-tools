import sharp from "sharp";
import { colors } from "./colorMap";
import { createCanvas } from "canvas";
import { drawMapTiles } from "./drawMapTiles";

async function processImage(
  buffer: sharp.SharpOptions | Buffer | any,
  height: number,
  width: number,
  scale: number,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  biome: string
) {
  let image = sharp(buffer).sharpen();

  // Resize the image to fit within 1140 by 940
  image = await image.resize(1140, 940, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Calculate the new dimensions
  const { width: resizedWidth, height: resizedHeight } = await image.metadata();

  // Rotate if necessary to fit within the frame
  if (resizedHeight > frameHeight + 40 || resizedWidth > frameWidth + 40) {
    image = image.rotate(90);
  }

  // Add padding and extend the image to fit the frame
  image = image.extend({
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

  return image;
}

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

  // Detect if the orientation needs to be changed
  if (height * scale > 1280 || width * scale > 1080) {
    // Swap the dimensions for the canvas
    canvas = createCanvas(height * scale, width * scale);
    ctx = canvas.getContext("2d");

    // Rotate the canvas context
    ctx.rotate((90 * Math.PI) / 180);
    ctx.translate(0, -height * scale);

    // Draw the map tiles again on the rotated context
    await drawMapTiles(ctx, wallArray, scale);
    buffer = canvas.toBuffer("image/png");
  }

  const frameWidth = 1080;
  const frameHeight = 1280;
  const padding = 50;

  const image = await processImage(
    buffer,
    height,
    width,
    scale,
    frameWidth,
    frameHeight,
    padding,
    biome
  );
  const finalCanvas = await image.toBuffer();

  return sharp(finalCanvas);
}
