import fs from 'fs';
import iconv from 'iconv-lite';
import chardet from 'chardet';
import { ParsedMapData } from './types';
import { countResources } from '../utils/countResources';
import { getSizeCategory } from '../utils/getSizeCategory';

/**
 * Parses map data from a file to extract detailed game map information.
 * This module reads a map file and parses its contents into a structured format.
 * Each map file should contain details about rows, columns, and resource distributions
 * across different sections like tiles, height, ore, and crystals.
 *
 * @module parseMapDataFromFile
 *
 * Parameters in ParsedMapData:
 * - rowcount: number of rows in the map
 * - colcount: number of columns in the map
 * - size: total number of tiles (rowcount * colcount)
 * - longestDimension: longer dimension between rowcount and colcount
 * - shortestDimension: shorter dimension between rowcount and colcount
 * - orientation: 'x' for horizontal, 'y' for vertical orientation
 * - maxElevation: highest elevation in the map
 * - minElevation: lowest elevation in the map
 * - averageElevation: average elevation across the map
 * - elevationRange: difference between max and min elevation
 * - oreCount: total quantity of ore across the map
 * - crystalCount: total quantity of crystals across the map
 * - biome: type of biome the map represents
 * - creator: creator of the map
 * - levelname: name of the level
 * - tilesArray: array of tile IDs
 * - heightArray: array of elevation values
 * - oreArray: array of ore quantities per tile
 * - crystalArray: array of crystal quantities per tile
 * - creatures: list of creatures in the map
 * - miners: list of miners in the map
 * - briefing: mission briefing text
 * - briefingsuccess: success briefing text
 * - briefingfailure: failure briefing text
 * - vehicles: list of vehicles in the map
 * - landslideFrequency: frequency of landslides
 * - script: script associated with the map
 * - buildings: list of buildings in the map
 * - objectives: list of objectives in the map
 * - comments: comments related to the map
 */

export function parseMapDataFromFile({ filePath }: { filePath: string }): Promise<ParsedMapData> {
    return new Promise((resolve, reject) => {
        console.log('Detecting file encoding...');
        const encoding = chardet.detectFileSync(filePath) || 'utf8';
        console.log(`Detected encoding: ${encoding}`);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('Failed to read file', err);
                reject(err);
                return;
            }

            console.log('Decoding file data...');
            const levelFileData = iconv.decode(data, encoding);

            const parsedData: ParsedMapData = {
                size: 0,
                rowcount: 0,
                colcount: 0,
                longestDimension: 0,
                shortestDimension: 0,
                axisCount: 0,
                maxElevation: 0,
                minElevation: Number.MAX_SAFE_INTEGER,
                averageElevation: 0,
                elevationRange: 0,
                oreCount: 0,
                crystalCount: 0,
                isSquare: false,
                biome: '',
                creator: '',
                levelname: '',
                sizeCategory: '',
                tilesArray: [],
                heightArray: [],
                oreArray: [],
                crystalArray: [],
                creatures: '',
                miners: '',
                briefing: '',
                briefingsuccess: '',
                briefingfailure: '',
                vehicles: '',
                landslideFrequency: '',
                script: '',
                buildings: '',
                objectives: '',
                comments: '',
            };

            const lines = levelFileData
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            let currentKey = '';
            let resourceKey = '';

            console.log('Processing lines...');
            lines.forEach(line => {
                if (line.endsWith('{')) {
                    currentKey = line.replace('{', '').trim();
                    console.log(`Entering section: ${currentKey}`);
                } else if (line.startsWith('}')) {
                    console.log(`Exiting section: ${currentKey}`);
                    currentKey = '';
                    resourceKey = '';
                } else if (currentKey === 'info') {
                    const [key, value] = line.split(':').map(part => part.trim().toLowerCase());
                    if (key in parsedData) {
                        if (['rowcount', 'colcount'].includes(key)) {
                            parsedData[key] = parseInt(value, 10);
                        } else {
                            parsedData[key] = value;
                        }
                        console.log(`Parsed info - ${key}: ${value}`);
                    }
                } else if (currentKey === 'resources') {
                    if (line.includes(':')) {
                        resourceKey = line.split(':')[0].trim();
                    } else if (resourceKey) {
                        const numbers = line
                            .split(',')
                            .map(n => parseInt(n.trim(), 10))
                            .filter(n => !isNaN(n));
                        if (resourceKey === 'crystals') {
                            parsedData.crystalArray = parsedData.crystalArray.concat(numbers);
                        } else if (resourceKey === 'ore') {
                            parsedData.oreArray = parsedData.oreArray.concat(numbers);
                        }
                        console.log(`Parsed resources - ${resourceKey}: ${numbers}`);
                    }
                } else if (['tiles', 'height'].includes(currentKey)) {
                    const numbers = line
                        .split(',')
                        .map(n => parseInt(n.trim(), 10))
                        .filter(n => !isNaN(n));
                    if (currentKey === 'tiles') {
                        parsedData.tilesArray = parsedData.tilesArray.concat(numbers);
                    } else if (currentKey === 'height') {
                        parsedData.heightArray = parsedData.heightArray.concat(numbers);
                    }
                    console.log(`Parsed ${currentKey}: ${numbers}`);
                } else {
                    if (parsedData[currentKey] === undefined) {
                        parsedData[currentKey] = '';
                    }
                    parsedData[currentKey] += line + '\n';
                    console.log(`Parsed ${currentKey}: ${line}`);
                }
            });

            parsedData.oreCount = countResources(parsedData.oreArray);
            parsedData.crystalCount = countResources(parsedData.crystalArray);

            if (parsedData.heightArray.length > 0) {
                parsedData.maxElevation = Math.max(...parsedData.heightArray);
                parsedData.minElevation = Math.min(...parsedData.heightArray);
                parsedData.averageElevation = parsedData.heightArray.reduce((acc, val) => acc + val, 0) / parsedData.heightArray.length;
                parsedData.elevationRange = parsedData.maxElevation - parsedData.minElevation;
                console.log('Elevation data calculated.');
            }

            parsedData.size = parsedData.rowcount * parsedData.colcount;
            parsedData.sizeCategory = getSizeCategory(parsedData.size);
            parsedData.longestDimension = Math.max(parsedData.rowcount, parsedData.colcount);
            parsedData.shortestDimension = Math.min(parsedData.rowcount, parsedData.colcount);
            parsedData.axisCount = parsedData.rowcount < parsedData.colcount ? parsedData.rowcount : parsedData.colcount;
            parsedData.isSquare = parsedData.rowcount === parsedData.colcount;

            console.log('Parsed data:', parsedData);
            resolve(parsedData);
        });
    });
}
