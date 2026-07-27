import { operationBus } from "./operationBus";

export interface HeapEntry<T> {
  item: T;
  priority: number;
  seq: number;
}

/** Binary min-heap with longhand sift-up / sift-down (lower priority = served first). */
export class PriorityQueue<T> {
  private heap: HeapEntry<T>[] = [];
  private seq = 0;
  lastTrace: { a: number; b: number }[] = [];

  private emit(method: string, detail: string, complexity: string, comparisons = 0) {
    operationBus.emit({
      structure: "heap",
      method,
      detail,
      complexity,
      comparisons,
      instructions: Math.max(1, comparisons),
      ok: true,
    });
  }

  private lessThan(a: HeapEntry<T>, b: HeapEntry<T>): boolean {
    if (a.priority !== b.priority) return a.priority < b.priority;
    return a.seq < b.seq;
  }

  private swap(i: number, j: number) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
    this.lastTrace.push({ a: i, b: j });
  }

  /** Insert then sift up. Time: O(log n). Space: O(1). */
  enqueue(item: T, priority: number): void {
    this.lastTrace = [];
    const entry: HeapEntry<T> = { item, priority, seq: this.seq++ };
    this.heap[this.heap.length] = entry;
    let child = this.heap.length - 1;
    let comparisons = 0;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      comparisons++;
      if (this.lessThan(this.heap[child], this.heap[parent])) {
        this.swap(child, parent);
        child = parent;
      } else break;
    }
    this.emit("enqueue", `${String(item)} p=${priority}`, "O(log n)", comparisons);
  }

  /** Remove root then sift down. Time: O(log n). Space: O(1). */
  dequeueHighestPriority(): T | null {
    this.lastTrace = [];
    if (this.heap.length === 0) {
      this.emit("dequeueHighestPriority", "empty", "O(log n)");
      return null;
    }
    const root = this.heap[0];
    const last = this.heap[this.heap.length - 1];
    this.heap.length = this.heap.length - 1;
    let comparisons = 0;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      let parent = 0;
      for (;;) {
        const left = 2 * parent + 1;
        const right = 2 * parent + 2;
        let smallest = parent;
        if (left < this.heap.length) {
          comparisons++;
          if (this.lessThan(this.heap[left], this.heap[smallest])) smallest = left;
        }
        if (right < this.heap.length) {
          comparisons++;
          if (this.lessThan(this.heap[right], this.heap[smallest])) smallest = right;
        }
        if (smallest === parent) break;
        this.swap(parent, smallest);
        parent = smallest;
      }
    }
    this.emit("dequeueHighestPriority", String(root.item), "O(log n)", comparisons);
    return root.item;
  }

  /** Root peek. Time: O(1). Space: O(1). */
  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0].item : null;
  }

  /** Floyd build-heap over raw entries. Time: O(n). Space: O(1). */
  heapify(entries: { item: T; priority: number }[]): void {
    this.heap = entries.map((e) => ({ item: e.item, priority: e.priority, seq: this.seq++ }));
    let comparisons = 0;
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      let parent = i;
      for (;;) {
        const left = 2 * parent + 1;
        const right = 2 * parent + 2;
        let smallest = parent;
        if (left < this.heap.length) {
          comparisons++;
          if (this.lessThan(this.heap[left], this.heap[smallest])) smallest = left;
        }
        if (right < this.heap.length) {
          comparisons++;
          if (this.lessThan(this.heap[right], this.heap[smallest])) smallest = right;
        }
        if (smallest === parent) break;
        this.swap(parent, smallest);
        parent = smallest;
      }
    }
    this.emit("heapify", `${this.heap.length} entries`, "O(n)", comparisons);
  }

  /** Backing array snapshot. Time: O(n). Space: O(n). */
  toArray(): HeapEntry<T>[] {
    const out: HeapEntry<T>[] = [];
    for (let i = 0; i < this.heap.length; i++) out[i] = this.heap[i];
    return out;
  }

  /** Time: O(1). Space: O(1). */
  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}