/**
 * Creates a 2D array from a flat array of numbers by grouping elements into subarrays.
 * Each subarray will contain a specified number of elements, corresponding to the 'width' parameter.
 *
 * @param {number[]} data - The flat array of numbers to be converted into a 2D array.
 * @param {number} width - The number of elements each subarray should contain, representing the width of the 2D array.
 * @returns {number[][]} A 2D array where each subarray represents a row in the grid.
 */

export function create2DArray({
  data,
  width,
}: {
  data: number[];
  width: number;
}): number[][] {
  let result: number[][] = []; // Initialize the resulting 2D array
  // Iterate through the flat array in steps of 'width' to create subarrays
  for (let i = 0; i < data.length; i += width) {
    // Slice the flat array from the current index up to 'width' elements and add to the result
    result.push(data.slice(i, i + width));
  }
  return result; // Return the newly created 2D array
}
