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

  // Resize image to fit within the frame dimensions, considering padding
  image = await image.resize(
    frameWidth - 2 * padding,
    frameHeight - 2 * padding,
    {
      fit: "inside",
      withoutEnlargement: true,
    }
  );

  // Extend the resized image with padding and colored background
  image = await image.extend({
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

  // Rotate the image if it is in landscape (width > height)
  const metadata = await image.metadata();
  if (metadata.width > metadata.height) {
    image = image.rotate(90);
  }

  return image;
}

export async function generatePNG(
  wallArray: string | any[],
  biome = "default"
) {
  const scale = 30;
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameWidth = 1280;
  const frameHeight = 1080;
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
