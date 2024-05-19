import { Color } from "../types/types";
import { CanvasRenderingContext2D, createCanvas } from "canvas";

export function drawTile(
  ctx: CanvasRenderingContext2D,
  i: number,
  j: number,
  scale: number,
  color: Color
) {
  // Create a pattern canvas for detailed texture drawing
  const patternCanvas = createCanvas(scale, scale);
  const patternCtx = patternCanvas.getContext("2d");

  // Define a gradient for visual depth
  const tileGradient = patternCtx.createLinearGradient(0, 0, scale, scale);
  tileGradient.addColorStop(
    0,
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha || 1})`
  );
  tileGradient.addColorStop(
    1,
    `rgba(${Math.max(0, color.r - 20)}, ${Math.max(
      0,
      color.g - 20
    )}, ${Math.max(0, color.b - 20)}, ${color.alpha || 1})`
  );
  patternCtx.fillStyle = tileGradient;
  patternCtx.fillRect(0, 0, scale, scale);

  // Add a subtle texture to the tile
  patternCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  patternCtx.lineWidth = 1;
  for (let k = 0; k < scale; k += 5) {
    patternCtx.beginPath();
    patternCtx.moveTo(k, 0);
    patternCtx.lineTo(0, k);
    patternCtx.moveTo(scale, k);
    patternCtx.lineTo(k, scale);
    patternCtx.moveTo(k, scale);
    patternCtx.lineTo(scale, k);
    patternCtx.stroke();
  }

  // Shadow and highlight for depth
  // Apply shadows for a raised tile effect
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Apply the pattern
  const pattern = ctx.createPattern(patternCanvas, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(j * scale, i * scale, scale, scale);

  // Draw highlight on the top and left edges for a beveled look
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.moveTo(j * scale, i * scale + scale);
  ctx.lineTo(j * scale, i * scale);
  ctx.lineTo(j * scale + scale, i * scale);
  ctx.stroke();

  // Reset shadow to prevent it from affecting other elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
