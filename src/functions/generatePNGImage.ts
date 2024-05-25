import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import { colors } from '../utils/colorMap';
import { parseMapDataFromFile } from '../fileParser/mapFileParser';
import { Color, GenerateImageResult } from '../types';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

dotenv.config({ path: '.env.local' });

export const generatePNGImage = async ({ filePath, outputFileName = 'screenshot_render.png' }: { filePath: string; outputFileName?: string }): Promise<GenerateImageResult> => {
    const outputDir = path.dirname(filePath);
    const screenshotFilePath = path.join(outputDir, outputFileName);

    let fileAccessed = false;
    let parseDataSuccess = false;
    let wallArrayGenerated = false;
    let imageBufferCreated = false;
    let fileSaved = false;
    let imageCreated = false;
    const errorDetails: GenerateImageResult['errorDetails'] = {};
    let imageBuffer: Buffer | undefined;

    try {
        await fs.access(screenshotFilePath);
        fileAccessed = true;
    } catch (accessError) {
        if ((accessError as NodeJS.ErrnoException).code !== 'ENOENT') {
            errorDetails.accessError = (accessError as Error).message;
        }
    }

    try {
        if (!fileAccessed) {
            const parsedData = await parseMapDataFromFile({ filePath });
            parseDataSuccess = true;
            const wallArray = create2DArray(parsedData.tilesArray, parsedData.colcount);
            wallArrayGenerated = true;
            imageBuffer = await createPNGImageBuffer(wallArray, parsedData.biome);
            imageBufferCreated = true;
            await sharp(imageBuffer).toFile(screenshotFilePath);
            fileSaved = true;
            imageCreated = true;
        }
        return {
            status: true,
            filePath: screenshotFilePath,
            fileAccessed,
            parseDataSuccess,
            wallArrayGenerated,
            imageBufferCreated,
            fileSaved,
            imageCreated,
            imageBuffer,
        };
    } catch (error: any) {
        if (!parseDataSuccess) errorDetails.parseError = error.message;
        else if (!wallArrayGenerated) errorDetails.bufferError = error.message;
        else if (!imageBufferCreated) errorDetails.bufferError = error.message;
        else errorDetails.saveError = error.message;

        return {
            status: false,
            filePath: screenshotFilePath,
            fileAccessed,
            parseDataSuccess,
            wallArrayGenerated,
            imageBufferCreated,
            fileSaved,
            imageCreated,
            errorDetails,
        };
    }
};

const createPNGImageBuffer = async (wallArray: number[][], biome = 'default') => {
    const scale = 17;
    const width = wallArray.length;
    const height = wallArray[0].length;
    const borderTiles = 2;
    const canvasWidth = (width + borderTiles * 2) * scale;
    const canvasHeight = (height + borderTiles * 2) * scale;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw the border
    ctx.fillStyle = getBiomeColor(biome);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render the map tiles with the border
    await renderMapTiles(ctx, wallArray, scale, borderTiles);

    const buffer = canvas.toBuffer('image/png');

    // Scale the image to 1280x1280
    const scaledBuffer = await sharp(buffer)
        .resize(1280, 1280, {
            fit: 'contain',
            background: getBiomeColorObject(biome),
        })
        .toBuffer();

    return scaledBuffer;
};

const getBiomeColor = (biome: string): string => {
    const color = colors[biome.toLowerCase()] || colors.default;
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha || 1})`;
};

const getBiomeColorObject = (biome: string) => {
    const color = colors[biome.toLowerCase()] || colors.default;
    return {
        r: color.r,
        g: color.g,
        b: color.b,
        alpha: color.alpha || 1,
    };
};

const renderMapTiles = async (ctx: CanvasRenderingContext2D, wallArray: number[][], scale: number, borderTiles: number) => {
    for (let y = 0; y < wallArray.length; y++) {
        for (let x = 0; x < wallArray[0].length; x++) {
            const tile = wallArray[y][x];
            const color = colors[tile] || colors.default;
            drawMapTile(ctx, x + borderTiles, y + borderTiles, scale, color, tile);
        }
    }
};

const drawMapTile = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: Color, tile: number) => {
    const fallbackColor: Color = { r: 255, g: 0, b: 0, alpha: 1 };
    const { r = fallbackColor.r, g = fallbackColor.g, b = fallbackColor.b, alpha = fallbackColor.alpha } = color || {};

    if (color === undefined) {
        console.warn(`Undefined color for tile: ${tile}`);
    }

    const patternCanvas = createCanvas(scale, scale);
    const patternCtx = patternCanvas.getContext('2d');

    const tileGradient = patternCtx.createLinearGradient(0, 0, scale, scale);
    tileGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    tileGradient.addColorStop(1, `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, ${alpha})`);
    patternCtx.fillStyle = tileGradient;
    patternCtx.fillRect(0, 0, scale, scale);

    patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(x * scale, y * scale, scale, scale);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x * scale, y * scale + scale);
    ctx.lineTo(x * scale, y * scale);
    ctx.lineTo(x * scale + scale, y * scale);
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

const create2DArray = (data: number[], width: number): number[][] => {
    const result: number[][] = [];
    for (let i = 0; i < data.length; i += width) {
        result.push(data.slice(i, i + width));
    }
    return result;
};
