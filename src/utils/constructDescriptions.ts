import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export function constructDescription(parsedData: any): string {
  const descriptionParts = [] as any;

  descriptionParts.push(
    `This is a ${parsedData.sizeCategory} map with dimensions of ${parsedData.rowcount}x${parsedData.colcount} tiles.`
  );

  if (parsedData.biome) {
    descriptionParts.push(`It features a ${parsedData.biome} biome.`);
  }

  if (
    parsedData.minElevation !== null &&
    parsedData.maxElevation !== null &&
    parsedData.minElevation !== parsedData.maxElevation
  ) {
    descriptionParts.push(
      `The map has an elevation range from ${parsedData.minElevation} to ${parsedData.maxElevation}.`
    );
  }

  if (parsedData.oreCount) {
    descriptionParts.push(
      `The map contains ${parsedData.oreCount} ore deposits.`
    );
  }

  if (parsedData.crystalCount) {
    descriptionParts.push(
      `The map contains ${parsedData.crystalCount} crystals.`
    );
  }

  if (parsedData.averageElevation !== null) {
    descriptionParts.push(
      `The average elevation of the map is ${parsedData.averageElevation}.`
    );
  }

  descriptionParts.push(`Created using Hognose by charredUtensil.`);

  return descriptionParts.join(" ");
}

export function constructHtmlDescription(parsedData: any): string {
  const descriptionParts = [] as any;

  descriptionParts.push(
    `<div>This is a ${parsedData.sizeCategory} map with dimensions of ${parsedData.rowcount}x${parsedData.colcount} tiles.</div>`
  );

  if (parsedData.biome) {
    descriptionParts.push(
      `<div>It features a ${parsedData.biome} biome.</div>`
    );
  }

  if (
    parsedData.minElevation !== null &&
    parsedData.maxElevation !== null &&
    parsedData.minElevation !== parsedData.maxElevation
  ) {
    descriptionParts.push(
      `<div>The map has an elevation range from ${parsedData.minElevation} to ${parsedData.maxElevation}.</div>`
    );
  }

  if (parsedData.oreCount) {
    descriptionParts.push(
      `<div>The map contains ${parsedData.oreCount} ore deposits.</div>`
    );
  }

  if (parsedData.crystalCount) {
    descriptionParts.push(
      `<div>The map contains ${parsedData.crystalCount} crystals.</div>`
    );
  }

  if (parsedData.averageElevation !== null) {
    descriptionParts.push(
      `<div>The average elevation of the map is ${parsedData.averageElevation}.</div>`
    );
  }

  descriptionParts.push(`<div>Created using Hognose by charredUtensil.</div>`);

  return descriptionParts.join("\n");
}
