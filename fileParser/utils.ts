export function countResources(resourceArray: any[]) {
  return resourceArray.flat().reduce((count: number, value: number) => {
    if (value > 0) {
      return count + value;
    }
    return count;
  }, 0);
}

export function getSizeCategory(size: number) {
  const averageSize = 2808.509;
  const smallThreshold = averageSize * 0.66;
  const largeThreshold = averageSize * 1.5;

  if (size < smallThreshold) return "small";
  if (size > largeThreshold) return "large";
  return "medium";
}
