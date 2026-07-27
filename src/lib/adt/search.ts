import { operationBus } from "./operationBus";

export interface SearchResult {
  foundIndex: number;
  comparisons: number;
  inspectedIndices: number[];
  elapsedMs: number;
  name: string;
  complexity: string;
}

/** Scan every element in order. Time: O(n). Space: O(1). */
export function linearSearch<T>(items: T[], match: (item: T) => boolean): SearchResult {
  const inspectedIndices: number[] = [];
  let comparisons = 0;
  const t0 = performance.now();
  let foundIndex = -1;
  for (let i = 0; i < items.length; i++) {
    comparisons++;
    inspectedIndices.push(i);
    if (match(items[i])) {
      foundIndex = i;
      break;
    }
  }
  const elapsedMs = performance.now() - t0;
  operationBus.emit({
    structure: "search",
    method: "linearSearch",
    detail: `${comparisons} comparisons`,
    complexity: "O(n)",
    comparisons,
    instructions: comparisons,
    ok: true,
  });
  return { foundIndex, comparisons, inspectedIndices, elapsedMs, name: "Linear Search", complexity: "O(n)" };
}

/** Halving search over a pre-sorted array. Time: O(log n). Space: O(1). */
export function binarySearch<T>(sorted: T[], keyOf: (item: T) => string, target: string): SearchResult {
  const inspectedIndices: number[] = [];
  let comparisons = 0;
  const t0 = performance.now();
  let lo = 0;
  let hi = sorted.length - 1;
  let foundIndex = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    inspectedIndices.push(mid);
    comparisons++;
    const k = keyOf(sorted[mid]);
    if (k === target) {
      foundIndex = mid;
      break;
    }
    if (k < target) lo = mid + 1;
    else hi = mid - 1;
  }
  const elapsedMs = performance.now() - t0;
  operationBus.emit({
    structure: "search",
    method: "binarySearch",
    detail: `${comparisons} comparisons`,
    complexity: "O(log n)",
    comparisons,
    instructions: comparisons,
    ok: true,
  });
  return { foundIndex, comparisons, inspectedIndices, elapsedMs, name: "Binary Search", complexity: "O(log n)" };
}