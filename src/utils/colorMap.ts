import { Color } from '../types';

export const colors: { [key: number | string]: Color | any } = {
    1: { r: 124, g: 92, b: 70 }, // Ground
    5: { r: 92, g: 58, b: 40 }, // not sure maybe hot rock almost lava
    6: { r: 255, g: 50, b: 0 }, // Lava
    7: { r: 0, g: 0, b: 255 }, // Placeholder color
    8: { r: 255, g: 255, b: 0 }, // Placeholder color
    9: { r: 75, g: 0, b: 130 }, // Placeholder color
    10: { r: 0, g: 255, b: 0 }, // Placeholder color
    11: { r: 30, g: 84, b: 197 }, // Water (Teal Blue)
    12: { r: 180, g: 180, b: 20 }, // Slimy Slug hole
    14: { r: 220, g: 220, b: 220 }, // Building power path
    24: { r: 180, g: 150, b: 100 }, // Placeholder color
    26: { r: 169, g: 109, b: 82 }, // Dirt
    30: { r: 139, g: 104, b: 86 }, // Loose Rock
    34: { r: 77, g: 53, b: 50 }, // Hard Rock
    38: { r: 0, g: 0, b: 0, a: 0 }, // Solid Rock, fully transparent
    42: { r: 206, g: 233, b: 104 }, // Energy Crystal Seam
    46: { r: 200, g: 85, b: 30 }, // Ore Seam
    50: { r: 255, g: 255, b: 70 }, // Recharge Seam
    60: { r: 46, g: 23, b: 95, alpha: 0.1 }, // Landslide rubble
    61: { r: 46, g: 23, b: 95, alpha: 0.5 }, // Landslide rubble
    62: { r: 46, g: 23, b: 95, alpha: 0.3 }, // Landslide rubble
    63: { r: 46, g: 23, b: 95 }, // Landslide rubble
    64: { r: 46, g: 23, b: 95, alpha: 0.7 }, // Landslide rubble
    65: { r: 128, g: 0, b: 128 }, // Placeholder color
    101: { r: 124, g: 92, b: 70 }, // Ground
    102: { r: 173, g: 216, b: 230 }, // Placeholder color
    103: { r: 100, g: 100, b: 100 }, // Placeholder color
    104: { r: 255, g: 192, b: 203 }, // Placeholder color
    105: { r: 90, g: 60, b: 30 }, // Placeholder color
    106: { r: 255, g: 70, b: 10, alpha: 0.9 }, // Lava
    107: { r: 0, g: 255, b: 127 }, // Placeholder color
    108: { r: 255, g: 0, b: 255 }, // Placeholder color
    109: { r: 255, g: 165, b: 0 }, // Placeholder color
    110: { r: 0, g: 128, b: 128 }, // Placeholder color
    111: { r: 30, g: 95, b: 220 }, // Water
    112: { r: 180, g: 180, b: 20 }, // Slimy Slug hole
    114: { r: 220, g: 220, b: 220 }, // Building power path
    115: { r: 220, g: 220, b: 220 }, // dunno
    124: { r: 70, g: 130, b: 180, alpha: 0.9 }, // Floating Flat Panels?
    160: { r: 255, g: 0, b: 0 }, // Placeholder color
    161: { r: 238, g: 130, b: 238 }, // Placeholder color
    162: { r: 34, g: 139, b: 34 }, // Placeholder color
    163: { r: 46, g: 23, b: 95 }, // Landslide rubble
    164: { r: 65, g: 33, b: 95 }, // Landslide rubble
    165: { r: 46, g: 23, b: 95, alpha: 0.5 }, // Weird Rubble?
    rock: { r: 120, g: 115, b: 110, alpha: 0.2 }, // BIOME BORDER COLOR Rocky, natural grey with transparency
    lava: { r: 255, g: 50, b: 0, alpha: 0.2 }, // BIOME BORDER COLOR Lava, orange with transparency
    ice: { r: 150, g: 200, b: 240, alpha: 0.2 }, // More bluish for ice biome
};
