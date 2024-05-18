export interface ParsedMapData {
  rowcount: number;
  colcount: number;
  size: number;
  longestDimension: number;
  shortestDimension: number;
  axisCount: number;
  maxElevation: number;
  minElevation: number;
  averageElevation: number;
  elevationRange: number;
  oreCount: number;
  crystalCount: number;
  isSquare: boolean;
  biome: string;
  creator: string;
  levelname: string;
  sizeCategory: string;
  tilesArray: number[];
  heightArray: number[];
  oreArray: number[];
  crystalArray: number[];
}
