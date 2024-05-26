import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function calculateMapSizeStats(baseDir: string): Promise<any> {
    let totalSize = 0;
    let fileCount = 0;
    let failedCount = 0;
    let minSize = Infinity;
    let maxSize = -Infinity;
    let failedFiles: string[] = [];
    let emptyDatDirectories: string[] = [];
    let directoriesChecked = 0;
    let directoriesWithDatFiles = 0;

    let totalCrystals = 0;
    let totalOre = 0;
    let minCrystals = Infinity;
    let maxCrystals = -Infinity;
    let minOre = Infinity;
    let maxOre = -Infinity;

    let totalCrystalDensity = 0;
    let totalOreDensity = 0;
    let minCrystalDensity = Infinity;
    let maxCrystalDensity = -Infinity;
    let minOreDensity = Infinity;
    let maxOreDensity = -Infinity;

    let totalOreToCrystalRatio = 0;

    async function traverseDirectory(directory: string): Promise<boolean> {
        directoriesChecked++;
        let datFileFound = false;

        try {
            const directoryContents = await fs.readdir(directory, {
                withFileTypes: true,
            });
            for (const dirent of directoryContents) {
                const fullPath = path.join(directory, dirent.name);
                if (dirent.isDirectory()) {
                    const isEmpty = await traverseDirectory(fullPath);
                    if (isEmpty) {
                        emptyDatDirectories.push(fullPath);
                    }
                } else if (dirent.name.endsWith('.dat')) {
                    datFileFound = true;
                    try {
                        const data = await fs.readFile(fullPath, 'utf8');
                        const size = parseMapSize(data);
                        const resourceStats = parseResourceStats(data);

                        if (size !== null) {
                            totalSize += size;
                            fileCount++;
                            if (size < minSize) minSize = size;
                            if (size > maxSize) maxSize = size;

                            totalCrystals += resourceStats.crystals.count;
                            totalOre += resourceStats.ore.count;
                            if (resourceStats.crystals.count < minCrystals) minCrystals = resourceStats.crystals.count;
                            if (resourceStats.crystals.count > maxCrystals) maxCrystals = resourceStats.crystals.count;
                            if (resourceStats.ore.count < minOre) minOre = resourceStats.ore.count;
                            if (resourceStats.ore.count > maxOre) maxOre = resourceStats.ore.count;

                            totalCrystalDensity += resourceStats.crystals.density;
                            totalOreDensity += resourceStats.ore.density;
                            if (resourceStats.crystals.density < minCrystalDensity) minCrystalDensity = resourceStats.crystals.density;
                            if (resourceStats.crystals.density > maxCrystalDensity) maxCrystalDensity = resourceStats.crystals.density;
                            if (resourceStats.ore.density < minOreDensity) minOreDensity = resourceStats.ore.density;
                            if (resourceStats.ore.density > maxOreDensity) maxOreDensity = resourceStats.ore.density;

                            if (resourceStats.crystals.count > 0) {
                                const oreToCrystalRatio = resourceStats.ore.count / resourceStats.crystals.count;
                                totalOreToCrystalRatio += oreToCrystalRatio;
                            }
                        } else {
                            failedCount++;
                            failedFiles.push(fullPath);
                        }
                    } catch (readError) {
                        console.error(`[ERROR] Error reading file ${fullPath}: ${readError}`);
                        failedCount++;
                        failedFiles.push(fullPath);
                    }
                }
            }
        } catch (dirError) {
            console.error(`[ERROR] Error accessing directory ${directory}: ${dirError}`);
        }

        if (datFileFound) {
            directoriesWithDatFiles++;
        }

        return !datFileFound;
    }

    function parseMapSize(fileContent: string): number | null {
        const rowMatch = fileContent.match(/rowcount:\s*(\d+)/);
        const colMatch = fileContent.match(/colcount:\s*(\d+)/);
        if (rowMatch && colMatch) {
            return parseInt(rowMatch[1], 10) * parseInt(colMatch[1], 10);
        }
        return null;
    }

    function parseResourceStats(fileContent: string): any {
        const crystalsArray = parseResourceArray(fileContent, 'crystals');
        const oreArray = parseResourceArray(fileContent, 'ore');
        const totalCrystals = crystalsArray.flat().reduce((sum, val) => sum + val, 0);
        const totalOre = oreArray.flat().reduce((sum, val) => sum + val, 0);
        const area = crystalsArray.length * (crystalsArray[0]?.length || 0);
        const crystalDensity = (totalCrystals / area) * 100;
        const oreDensity = (totalOre / area) * 100;

        return {
            crystals: {
                count: totalCrystals,
                density: crystalDensity,
            },
            ore: {
                count: totalOre,
                density: oreDensity,
            },
        };
    }

    function parseResourceArray(fileContent: string, resourceName: string): number[][] {
        const resourceArray: number[][] = [];
        const resourceSection = fileContent.split(`${resourceName}:`)[1]?.split('}')[0];
        if (resourceSection) {
            resourceSection.split('\n').forEach(line => {
                const numbers = line
                    .split(',')
                    .map(n => parseInt(n.trim(), 10))
                    .filter(n => !isNaN(n));
                if (numbers.length > 0) {
                    resourceArray.push(numbers);
                }
            });
        }
        return resourceArray;
    }

    const isEmpty = await traverseDirectory(baseDir);
    if (isEmpty) {
        emptyDatDirectories.push(baseDir);
    }

    const averageSize = fileCount > 0 ? (totalSize / fileCount).toFixed(2) : 0;
    const averageCrystals = fileCount > 0 ? (totalCrystals / fileCount).toFixed(2) : 0;
    const averageOre = fileCount > 0 ? (totalOre / fileCount).toFixed(2) : 0;
    const averageCrystalDensity = fileCount > 0 ? (totalCrystalDensity / fileCount).toFixed(2) : 0;
    const averageOreDensity = fileCount > 0 ? (totalOreDensity / fileCount).toFixed(2) : 0;
    const averageOreToCrystalRatio = fileCount > 0 ? (totalOreToCrystalRatio / fileCount).toFixed(2) : 0;

    const result = {
        processedFiles: fileCount,
        failedFiles: failedCount,
        directoriesChecked,
        directoriesWithDatFiles,
        averageSize,
        minSize,
        maxSize,
        averageCrystals,
        minCrystals,
        maxCrystals,
        averageOre,
        minOre,
        maxOre,
        averageCrystalDensity,
        minCrystalDensity,
        maxCrystalDensity,
        averageOreDensity,
        minOreDensity,
        maxOreDensity,
        averageOreToCrystalRatio,
        failedFilesDetails: failedFiles,
        emptyDatDirectories,
    };

    console.log('========== Manic Miners Map Tool Statistics ==========');
    console.log(`Processed files: ${fileCount}`);
    console.log(`Failed to process files: ${failedCount}`);
    console.log(`Directories checked: ${directoriesChecked}`);
    console.log(`Directories with .dat files: ${directoriesWithDatFiles}`);
    if (failedCount > 0) {
        console.log('Failed file paths:');
        failedFiles.forEach(file => console.log(file));
    }
    if (emptyDatDirectories.length > 0) {
        console.log('Directories without .dat files:');
        emptyDatDirectories.forEach(dir => console.log(dir));
    }
    console.log(`Average map size: ${averageSize}`);
    console.log(`Minimum map size: ${minSize}`);
    console.log(`Maximum map size: ${maxSize}`);
    console.log(`Average crystals: ${averageCrystals}`);
    console.log(`Minimum crystals: ${minCrystals}`);
    console.log(`Maximum crystals: ${maxCrystals}`);
    console.log(`Average ore: ${averageOre}`);
    console.log(`Minimum ore: ${minOre}`);
    console.log(`Maximum ore: ${maxOre}`);
    console.log(`Average crystal density: ${averageCrystalDensity}%`);
    console.log(`Minimum crystal density: ${minCrystalDensity}%`);
    console.log(`Maximum crystal density: ${maxCrystalDensity}%`);
    console.log(`Average ore density: ${averageOreDensity}%`);
    console.log(`Minimum ore density: ${minOreDensity}%`);
    console.log(`Maximum ore density: ${maxOreDensity}%`);
    console.log(`Average ore to crystal ratio: ${averageOreToCrystalRatio} (ore/crystals)`);
    console.log('======================================================');

    return result;
}

async function init() {
    try {
        const directoryPath: any = process.env.MMT_CATALOG_DIR;
        const processingResults = await calculateMapSizeStats(directoryPath);
        console.log(processingResults);
    } catch (err) {
        console.error('[ERROR] Error initializing map size stats calculation:', err);
    }
}

init();
