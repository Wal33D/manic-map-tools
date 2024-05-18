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
  const minHeightScale = 1280 / wallArray[0].length; // Scale based on height
  const minWidthScale = 1280 / wallArray.length; // Scale based on width
  const scale = Math.max(minHeightScale, minWidthScale); // Ensure at least one dimension is >= 1280

  const width = wallArray.length * scale;
  const height = wallArray[0].length * scale;
  const canvas = createCanvas(Math.floor(width), Math.floor(height));
  const ctx = canvas.getContext("2d");

  await drawMapTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");
  const frameWidth = Math.floor(width);
  const frameHeight = Math.floor(height);
  const padding = 50;

  let image = await processImage(
    buffer,
    height,
    width,
    scale,
    frameWidth,
    frameHeight,
    padding,
    biome
  );

  // Final check and resize if needed
  const metadata = await image.metadata();
  if (metadata.width > 1280 || metadata.height > 1080) {
    image = await image.resize(1280, 1080, { fit: "cover" });

    // Create a new transparent canvas to center the image
    const finalImage = sharp({
      create: {
        width: 1280,
        height: 1080,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    // Calculate offsets for centering the image
    const xOffset = (1280 - metadata.width) / 2;
    const yOffset = (1080 - metadata.height) / 2;

    // Composite the resized image onto the transparent background
    image = finalImage.composite([
      {
        input: await image.toBuffer(),
        left: Math.max(xOffset, 0),
        top: Math.max(yOffset, 0),
      },
    ]);
  }

  const finalCanvas = await image.toBuffer();
  return sharp(finalCanvas);
}
