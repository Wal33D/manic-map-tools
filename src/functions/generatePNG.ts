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
  biome: string
) {
  let image = sharp(buffer).sharpen();
  const orientation = width > height ? "landscape" : "portrait";

  // Rotate image if in portrait mode to fit it as landscape
  if (orientation === "portrait") {
    image = image.rotate(90);
  }

  // Resize image to fit within the content dimensions
  const maxContentWidth = frameWidth - 80; // 40 px border on each side
  const maxContentHeight = frameHeight - 80; // 40 px border on each top and bottom
  image = await image.resize(maxContentWidth, maxContentHeight, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // Calculate dynamic padding to center the image within the frame
  const metadata = await image.metadata();
  const horizontalPadding = Math.max(40, (frameWidth - metadata.width) / 2);
  const verticalPadding = Math.max(40, (frameHeight - metadata.height) / 2);

  // Extend the image to the full frame size with dynamic padding
  return image.extend({
    top: Math.floor(verticalPadding),
    bottom: Math.ceil(verticalPadding),
    left: Math.floor(horizontalPadding),
    right: Math.ceil(horizontalPadding),
    background: colors[biome.toLowerCase()] || { r: 0, g: 0, b: 0, alpha: 0 },
  });
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

  const image = await processImage(
    buffer,
    height,
    width,
    scale,
    frameWidth,
    frameHeight,
    biome
  );
  const finalCanvas = await image.toBuffer();

  return sharp(finalCanvas);
}
