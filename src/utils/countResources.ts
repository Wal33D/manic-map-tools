export function countResources(resourceArray: any[]) {
  return resourceArray.flat().reduce((count: number, value: number) => {
    if (value > 0) {
      return count + value;
    }
    return count;
  }, 0);
}
