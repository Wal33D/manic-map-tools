import { colors } from "./colorMap";
import { drawTile } from "./drawTile";
import { CanvasRenderingContext2D } from "canvas";

export async function drawMapTiles(
  ctx: CanvasRenderingContext2D,
  wallArray: string | any[],
  scale: number
) {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[0].length; x++) {
      const tile = wallArray[y][x];
      const color = colors[tile] || { r: 255, g: 255, b: 255, a: 1 };
      drawTile(ctx, x, y, scale, color);
    }
  }
}
