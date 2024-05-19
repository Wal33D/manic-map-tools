export function camelCaseString(str: string) {
  const words = str
    .replace(/'/g, "")
    .replace(/[^a-zA-Z0-9\s\-]/g, "")
    .split(/[\s\-]+/);
  return words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}
