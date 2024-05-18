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
  let orientation = width > height ? "landscape" : "portrait";

  // Rotate image if in portrait mode initially to make it landscape
  if (orientation === "portrait") {
    image = image.rotate(90);
    [width, height] = [height, width]; // Swap dimensions after rotation
  }

  // Resize image to fit within the frame dimensions, considering padding
  image = await image.resize(
    frameWidth - 2 * padding,
    frameHeight - 2 * padding,
    {
      fit: "inside",
      withoutEnlargement: true,
    }
  );

  // Ensure the image is in portrait for the final output
  orientation = frameWidth > frameHeight ? "landscape" : "portrait";
  if (orientation === "landscape") {
    image = image.rotate(90); // Rotate to make it portrait
  }

  // Extend the resized image with padding and colored background
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
  wallArray: string | any[],
  biome = "default"
) {
  const minHeightScale = 1280 / wallArray[0].length; // Scale based on height
  const minWidthScale = 1280 / wallArray.length; // Scale based on width
  const scale = Math.max(minHeightScale, minWidthScale); // Choose the maximum to ensure at least one dimension is >= 1280

  const width = wallArray.length * scale;
  const height = wallArray[0].length * scale;
  const canvas = createCanvas(Math.floor(width), Math.floor(height));
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameWidth = Math.floor(width); // Update frame dimensions based on new scale
  const frameHeight = Math.floor(height);
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
