import { createCanvas, CanvasRenderingContext2D } from "canvas";
import sharp from "sharp";
import { colors } from "./colorMap"; // Adjust the path as needed

export async function generateThumbnail(wallArray: string | any[]) {
  const scale = 5; // Smaller scale for thumbnails
  const width = wallArray.length;
  const height = wallArray[0].length;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");

  await drawMapThumbTiles(ctx, wallArray, scale);
  const buffer = canvas.toBuffer("image/png");

  return await sharp(buffer)
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0.1 },
    })
    .toBuffer();
}

async function drawMapThumbTiles(
  ctx: CanvasRenderingContext2D,
  wallArray: string | any[],
  scale: number
) {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
      drawThumbTile(ctx, x, y, scale, color);
    }
  }
}

function drawThumbTile(
  ctx: CanvasRenderingContext2D,
  y: number,
  x: number,
  scale: number,
  color: { r: number; g: number; b: number; a: number }
) {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}
