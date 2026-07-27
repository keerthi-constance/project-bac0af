import { operationBus } from "./operationBus";

export interface SortFrame {
  array: number[];
  a: number;
  b: number;
  kind: "compare" | "swap" | "overwrite" | "done";
  pass: number;
}

export interface SortResult {
  sortedArray: number[];
  comparisons: number;
  swaps: number;
  elapsedMs: number;
  frames: SortFrame[];
  name: string;
  complexity: string;
}

const MAX_FRAMES = 4000;

function pushFrame(frames: SortFrame[], f: SortFrame) {
  if (frames.length < MAX_FRAMES) frames.push(f);
}

function copy(input: number[]): number[] {
  const out: number[] = new Array(input.length);
  for (let i = 0; i < input.length; i++) out[i] = input[i];
  return out;
}

function emit(name: string, r: Omit<SortResult, "name" | "frames" | "complexity">, complexity: string) {
  operationBus.emit({
    structure: "sort",
    method: name,
    detail: `${r.sortedArray.length} items, ${r.comparisons} comparisons, ${r.swaps} swaps`,
    complexity,
    comparisons: r.comparisons,
    instructions: r.comparisons + r.swaps,
    ok: true,
  });
}

/** Bubble sort with early exit. Time: O(n²). Space: O(1). */
export function bubbleSort(input: number[]): SortResult {
  const a = copy(input);
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let swaps = 0;
  const t0 = performance.now();
  for (let pass = 0; pass < a.length - 1; pass++) {
    let swapped = false;
    for (let i = 0; i < a.length - 1 - pass; i++) {
      comparisons++;
      pushFrame(frames, { array: copy(a), a: i, b: i + 1, kind: "compare", pass });
      if (a[i] > a[i + 1]) {
        const tmp = a[i];
        a[i] = a[i + 1];
        a[i + 1] = tmp;
        swaps++;
        swapped = true;
        pushFrame(frames, { array: copy(a), a: i, b: i + 1, kind: "swap", pass });
      }
    }
    if (!swapped) break;
  }
  const elapsedMs = performance.now() - t0;
  pushFrame(frames, { array: copy(a), a: -1, b: -1, kind: "done", pass: 0 });
  const res = { sortedArray: a, comparisons, swaps, elapsedMs };
  emit("bubbleSort", res, "O(n²)");
  return { ...res, frames, name: "Bubble Sort", complexity: "O(n²)" };
}

/** Insertion sort shifting elements right. Time: O(n²), O(n) best. Space: O(1). */
export function insertionSort(input: number[]): SortResult {
  const a = copy(input);
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let swaps = 0;
  const t0 = performance.now();
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      pushFrame(frames, { array: copy(a), a: j, b: i, kind: "compare", pass: i });
      if (a[j] > key) {
        a[j + 1] = a[j];
        swaps++;
        pushFrame(frames, { array: copy(a), a: j, b: j + 1, kind: "swap", pass: i });
        j--;
      } else break;
    }
    a[j + 1] = key;
  }
  const elapsedMs = performance.now() - t0;
  pushFrame(frames, { array: copy(a), a: -1, b: -1, kind: "done", pass: 0 });
  const res = { sortedArray: a, comparisons, swaps, elapsedMs };
  emit("insertionSort", res, "O(n²)");
  return { ...res, frames, name: "Insertion Sort", complexity: "O(n²)" };
}

/** Bottom-up-free recursive merge sort. Time: O(n log n). Space: O(n). */
export function mergeSort(input: number[]): SortResult {
  const a = copy(input);
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let swaps = 0;
  const t0 = performance.now();

  const buffer: number[] = new Array(a.length);

  function merge(lo: number, mid: number, hi: number, depth: number) {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    while (i <= mid && j <= hi) {
      comparisons++;
      pushFrame(frames, { array: copy(a), a: i, b: j, kind: "compare", pass: depth });
      if (a[i] <= a[j]) buffer[k++] = a[i++];
      else buffer[k++] = a[j++];
    }
    while (i <= mid) buffer[k++] = a[i++];
    while (j <= hi) buffer[k++] = a[j++];
    for (let x = lo; x <= hi; x++) {
      a[x] = buffer[x];
      swaps++;
      pushFrame(frames, { array: copy(a), a: x, b: x, kind: "overwrite", pass: depth });
    }
  }

  function sort(lo: number, hi: number, depth: number) {
    if (lo >= hi) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid, depth + 1);
    sort(mid + 1, hi, depth + 1);
    merge(lo, mid, hi, depth);
  }

  sort(0, a.length - 1, 0);
  const elapsedMs = performance.now() - t0;
  pushFrame(frames, { array: copy(a), a: -1, b: -1, kind: "done", pass: 0 });
  const res = { sortedArray: a, comparisons, swaps, elapsedMs };
  emit("mergeSort", res, "O(n log n)");
  return { ...res, frames, name: "Merge Sort", complexity: "O(n log n)" };
}

/** Lomuto-partition quicksort. Time: O(n log n) avg, O(n²) worst. Space: O(log n). */
export function quickSort(input: number[]): SortResult {
  const a = copy(input);
  const frames: SortFrame[] = [];
  let comparisons = 0;
  let swaps = 0;
  const t0 = performance.now();

  function partition(lo: number, hi: number, depth: number): number {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      pushFrame(frames, { array: copy(a), a: j, b: hi, kind: "compare", pass: depth });
      if (a[j] <= pivot) {
        i++;
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
        swaps++;
        pushFrame(frames, { array: copy(a), a: i, b: j, kind: "swap", pass: depth });
      }
    }
    const tmp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = tmp;
    swaps++;
    pushFrame(frames, { array: copy(a), a: i + 1, b: hi, kind: "swap", pass: depth });
    return i + 1;
  }

  function sort(lo: number, hi: number, depth: number) {
    if (lo >= hi) return;
    const p = partition(lo, hi, depth);
    sort(lo, p - 1, depth + 1);
    sort(p + 1, hi, depth + 1);
  }

  sort(0, a.length - 1, 0);
  const elapsedMs = performance.now() - t0;
  pushFrame(frames, { array: copy(a), a: -1, b: -1, kind: "done", pass: 0 });
  const res = { sortedArray: a, comparisons, swaps, elapsedMs };
  emit("quickSort", res, "O(n log n)");
  return { ...res, frames, name: "Quick Sort", complexity: "O(n log n)" };
}

export const SORTERS: Record<string, (input: number[]) => SortResult> = {
  bubble: bubbleSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
};

export const SORTER_LABELS: Record<string, string> = {
  bubble: "Bubble Sort",
  insertion: "Insertion Sort",
  merge: "Merge Sort",
  quick: "Quick Sort",
};

/** Generic comparator quicksort used for table sorting. Time: O(n log n) avg. Space: O(log n). */
export function quickSortBy<T>(input: T[], compare: (a: T, b: T) => number): { sorted: T[]; comparisons: number } {
  const a: T[] = new Array(input.length);
  for (let i = 0; i < input.length; i++) a[i] = input[i];
  let comparisons = 0;

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      if (compare(a[j], pivot) <= 0) {
        i++;
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
    }
    const tmp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = tmp;
    return i + 1;
  }

  function sort(lo: number, hi: number) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  }

  sort(0, a.length - 1);
  operationBus.emit({
    structure: "sort",
    method: "quickSortBy",
    detail: `${a.length} rows, ${comparisons} comparisons`,
    complexity: "O(n log n)",
    comparisons,
    instructions: comparisons,
    ok: true,
  });
  return { sorted: a, comparisons };
}

/** Dataset generator for the sorting arena. Time: O(n). Space: O(n). */
export function makeDataset(size: number, distribution: string): number[] {
  const out: number[] = new Array(size);
  for (let i = 0; i < size; i++) out[i] = Math.floor(Math.random() * 1000) + 1;
  if (distribution === "reversed") {
    for (let i = 0; i < size; i++) out[i] = size - i;
  } else if (distribution === "nearly") {
    for (let i = 0; i < size; i++) out[i] = i + 1;
    const swapsToDo = Math.max(1, Math.floor(size * 0.05));
    for (let s = 0; s < swapsToDo; s++) {
      const i = Math.floor(Math.random() * size);
      const j = Math.floor(Math.random() * size);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
  } else if (distribution === "duplicates") {
    for (let i = 0; i < size; i++) out[i] = Math.floor(Math.random() * 10) + 1;
  }
  return out;
}