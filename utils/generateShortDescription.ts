export function generateShortDescription(parsedData: any): string {
  const biomeAdjectives: Record<string, string[]> = {
    ice: ["Icy", "Frozen", "Glacial", "Chilly", "Frosty", "Snowy", "Arctic"],
    rock: [
      "Rocky",
      "Stony",
      "Craggy",
      "Solid",
      "Boulder-strewn",
      "Granitic",
      "Rugged",
    ],
    lava: [
      "Molten",
      "Fiery",
      "Volcanic",
      "Blazing",
      "Searing",
      "Scorching",
      "Infernal",
    ],
  };

  const sizeDescriptors: Record<string, string[]> = {
    small: ["Cavern", "Nook", "Crevice", "Grotto", "Hollow", "Burrow"],
    medium: ["Cave", "Chamber", "Vault", "Den", "Gallery", "Gulf"],
    large: [
      "Expanse",
      "Abyss",
      "Underground Realm",
      "Subterranean World",
      "Cavernous Depths",
      "Enormous Cave",
    ],
  };

  const randomElement = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  const biome = randomElement(
    biomeAdjectives[parsedData.biome.toLowerCase()] || [parsedData.biome]
  );
  const size = randomElement(
    sizeDescriptors[parsedData.sizeCategory.toLowerCase()] || [
      parsedData.sizeCategory,
    ]
  );

  return `${biome} ${size}`;
}
