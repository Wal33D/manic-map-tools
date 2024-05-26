import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function calculateMapSizeStats(baseDir: string): Promise<any> {
    let totalSize = 0;
    let fileCount = 0;
    let failedCount = 0;
    let smallestSize = Infinity;
    let largestSize = -Infinity;
    let failedFiles: string[] = [];
    let emptyDatDirectories: string[] = [];
    let directoriesChecked = 0;
    let directoriesWithDatFiles = 0;

    let totalCrystals = 0;
    let totalOre = 0;
    let smallestCrystals = Infinity;
    let largestCrystals = -Infinity;
    let smallestOre = Infinity;
    let largestOre = -Infinity;

    let totalCrystalDensity = 0;
    let totalOreDensity = 0;
    let smallestCrystalDensity = Infinity;
    let largestCrystalDensity = -Infinity;
    let smallestOreDensity = Infinity;
    let largestOreDensity = -Infinity;

    let totalOreToCrystalRatio = 0;

    let totalVehicles = 0;
    let totalCreatures = 0;
    let totalBuildings = 0;

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
                        const vehicleStats = parseVehicleStats(data);
                        const creatureStats = parseCreatureStats(data);
                        const buildingStats = parseBuildingStats(data);

                        if (size !== null) {
                            totalSize += size;
                            fileCount++;
                            if (size < smallestSize) smallestSize = size;
                            if (size > largestSize) largestSize = size;

                            totalCrystals += resourceStats.crystals.count;
                            totalOre += resourceStats.ore.count;
                            if (resourceStats.crystals.count < smallestCrystals) smallestCrystals = resourceStats.crystals.count;
                            if (resourceStats.crystals.count > largestCrystals) largestCrystals = resourceStats.crystals.count;
                            if (resourceStats.ore.count < smallestOre) smallestOre = resourceStats.ore.count;
                            if (resourceStats.ore.count > largestOre) largestOre = resourceStats.ore.count;

                            totalCrystalDensity += resourceStats.crystals.density;
                            totalOreDensity += resourceStats.ore.density;
                            if (resourceStats.crystals.density < smallestCrystalDensity) smallestCrystalDensity = resourceStats.crystals.density;
                            if (resourceStats.crystals.density > largestCrystalDensity) largestCrystalDensity = resourceStats.crystals.density;
                            if (resourceStats.ore.density < smallestOreDensity) smallestOreDensity = resourceStats.ore.density;
                            if (resourceStats.ore.density > largestOreDensity) largestOreDensity = resourceStats.ore.density;

                            if (resourceStats.crystals.count > 0) {
                                const oreToCrystalRatio = resourceStats.ore.count / resourceStats.crystals.count;
                                totalOreToCrystalRatio += oreToCrystalRatio;
                            }

                            totalVehicles += vehicleStats.count;
                            totalCreatures += creatureStats.count;
                            totalBuildings += buildingStats.count;
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
        const rowMatch = fileContent.toLowerCase().match(/rowcount:\s*(\d+)/);
        const colMatch = fileContent.toLowerCase().match(/colcount:\s*(\d+)/);
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

        const crystalDensity = area > 0 ? (totalCrystals / area) * 100 : 0;
        const oreDensity = area > 0 ? (totalOre / area) * 100 : 0;

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

    function parseVehicleStats(fileContent: string): any {
        const vehicleArray = fileContent.match(/Vehicle[a-zA-Z]+_C/g) || [];
        return {
            count: vehicleArray.length,
        };
    }

    function parseCreatureStats(fileContent: string): any {
        const creatureArray = fileContent.match(/Creature[a-zA-Z]+_C/g) || [];
        return {
            count: creatureArray.length,
        };
    }

    function parseBuildingStats(fileContent: string): any {
        const buildingArray = fileContent.match(/Building[a-zA-Z]+_C/g) || [];
        return {
            count: buildingArray.length,
        };
    }

    const isEmpty = await traverseDirectory(baseDir);
    if (isEmpty) {
        emptyDatDirectories.push(baseDir);
    }

    const AVERAGE_MAP_SIZE = fileCount > 0 ? (totalSize / fileCount).toFixed(2) : 0;
    const AVERAGE_CRYSTAL_COUNT = fileCount > 0 ? (totalCrystals / fileCount).toFixed(2) : 0;
    const AVERAGE_ORE_COUNT = fileCount > 0 ? (totalOre / fileCount).toFixed(2) : 0;
    const AVERAGE_CRYSTAL_DENSITY = fileCount > 0 ? (totalCrystalDensity / fileCount).toFixed(2) : 0;
    const AVERAGE_ORE_DENSITY = fileCount > 0 ? (totalOreDensity / fileCount).toFixed(2) : 0;
    const AVERAGE_CRYSTAL_TO_ORE_RATIO = fileCount > 0 ? (totalOreToCrystalRatio / fileCount).toFixed(2) : 0;
    const AVERAGE_VEHICLE_PER_MAP = fileCount > 0 ? (totalVehicles / fileCount).toFixed(2) : 0;
    const AVERAGE_CREATURES_PER_MAP = fileCount > 0 ? (totalCreatures / fileCount).toFixed(2) : 0;
    const AVERAGE_BUILDINGS_PER_MAP = fileCount > 0 ? (totalBuildings / fileCount).toFixed(2) : 0;

    const result = {
        processedFiles: fileCount,
        failedFiles: failedCount,
        directoriesChecked,
        directoriesWithDatFiles,
        AVERAGE_MAP_SIZE,
        SMALLEST_MAP_SIZE: smallestSize,
        LARGEST_MAP_SIZE: largestSize,
        AVERAGE_CRYSTAL_COUNT,
        SMALLEST_CRYSTAL_COUNT: smallestCrystals,
        LARGEST_CRYSTAL_COUNT: largestCrystals,
        AVERAGE_ORE_COUNT,
        SMALLEST_ORE_COUNT: smallestOre,
        LARGEST_ORE_COUNT: largestOre,
        AVERAGE_CRYSTAL_DENSITY,
        SMALLEST_CRYSTAL_DENSITY: smallestCrystalDensity,
        LARGEST_CRYSTAL_DENSITY: largestCrystalDensity,
        AVERAGE_ORE_DENSITY,
        SMALLEST_ORE_DENSITY: smallestOreDensity,
        LARGEST_ORE_DENSITY: largestOreDensity,
        AVERAGE_CRYSTAL_TO_ORE_RATIO,
        AVERAGE_VEHICLE_PER_MAP,
        AVERAGE_CREATURES_PER_MAP,
        AVERAGE_BUILDINGS_PER_MAP,
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
    console.log('Map Size:');
    console.log('  Average:', AVERAGE_MAP_SIZE);
    console.log('  Smallest:', smallestSize);
    console.log('  Largest:', largestSize);
    console.log('Crystals:');
    console.log('  Average count:', AVERAGE_CRYSTAL_COUNT);
    console.log('  Smallest count:', smallestCrystals);
    console.log('  Largest count:', largestCrystals);
    console.log('  Average density:', AVERAGE_CRYSTAL_DENSITY, '%');
    console.log('  Smallest density:', smallestCrystalDensity, '%');
    console.log('  Largest density:', largestCrystalDensity, '%');
    console.log('Ore:');
    console.log('  Average count:', AVERAGE_ORE_COUNT);
    console.log('  Smallest count:', smallestOre);
    console.log('  Largest count:', largestOre);
    console.log('  Average density:', AVERAGE_ORE_DENSITY, '%');
    console.log('  Smallest density:', smallestOreDensity, '%');
    console.log('  Largest density:', largestOreDensity, '%');
    console.log('Ore to Crystal Ratio:');
    console.log('  Average:', AVERAGE_CRYSTAL_TO_ORE_RATIO);
    console.log('Vehicles:');
    console.log('  Average per map:', AVERAGE_VEHICLE_PER_MAP);
    console.log('Creatures:');
    console.log('  Average per map:', AVERAGE_CREATURES_PER_MAP);
    console.log('Buildings:');
    console.log('  Average per map:', AVERAGE_BUILDINGS_PER_MAP);
    console.log('======================================================');

    return result;
}

async function init() {
    try {
        const directoryPath: any = process.env.MMT_CATALOG_DIR;
        return await calculateMapSizeStats(directoryPath);
    } catch (err) {
        console.error('[ERROR] Error initializing map size stats calculation:', err);
    }
}

init();
