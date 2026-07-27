import { operationBus } from "./operationBus";

export interface HashEntry<T> {
  key: string;
  value: T;
  next: HashEntry<T> | null;
}

/** Separate-chaining hash table using the djb2 hash. */
export class HashTable<T> {
  buckets: (HashEntry<T> | null)[];
  private count = 0;
  lastProbe: { bucket: number; probes: number } = { bucket: -1, probes: 0 };

  constructor(public bucketCount = 16) {
    this.buckets = new Array<HashEntry<T> | null>(bucketCount).fill(null);
  }

  private emit(method: string, detail: string, complexity: string, comparisons = 0) {
    operationBus.emit({
      structure: "hash",
      method,
      detail,
      complexity,
      comparisons,
      instructions: Math.max(1, comparisons),
      ok: true,
    });
  }

  /** djb2 string hash. Time: O(k). Space: O(1). */
  hash(key: string, buckets = this.bucketCount): number {
    let h = 5381;
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
    }
    return h % buckets;
  }

  /** Insert or update. Time: O(1) average. Space: O(1). */
  put(key: string, value: T): void {
    const idx = this.hash(key);
    let cur = this.buckets[idx];
    let probes = 1;
    while (cur !== null) {
      if (cur.key === key) {
        cur.value = value;
        this.emit("put", `${key} (update)`, "O(1)", probes);
        return;
      }
      cur = cur.next;
      probes++;
    }
    this.buckets[idx] = { key, value, next: this.buckets[idx] };
    this.count++;
    this.emit("put", `${key} -> bucket ${idx}`, "O(1)", probes);
    if (this.loadFactor() > 0.75) this.resize(this.bucketCount * 2);
  }

  /** Lookup by key. Time: O(1) average, O(n) worst chain. Space: O(1). */
  get(key: string): { value: T | null; bucket: number; probes: number } {
    const idx = this.hash(key);
    let cur = this.buckets[idx];
    let probes = 0;
    while (cur !== null) {
      probes++;
      if (cur.key === key) {
        this.lastProbe = { bucket: idx, probes };
        this.emit("get", `${key} hit in ${probes} probe(s)`, "O(1)", probes);
        return { value: cur.value, bucket: idx, probes };
      }
      cur = cur.next;
    }
    this.lastProbe = { bucket: idx, probes };
    this.emit("get", `${key} miss`, "O(1)", probes || 1);
    return { value: null, bucket: idx, probes };
  }

  /** Unlink from its chain. Time: O(1) average. Space: O(1). */
  remove(key: string): boolean {
    const idx = this.hash(key);
    let cur = this.buckets[idx];
    let prev: HashEntry<T> | null = null;
    let probes = 0;
    while (cur !== null) {
      probes++;
      if (cur.key === key) {
        if (prev === null) this.buckets[idx] = cur.next;
        else prev.next = cur.next;
        this.count--;
        this.emit("remove", key, "O(1)", probes);
        return true;
      }
      prev = cur;
      cur = cur.next;
    }
    this.emit("remove", `${key} miss`, "O(1)", probes || 1);
    return false;
  }

  /** entries / buckets. Time: O(1). Space: O(1). */
  loadFactor(): number {
    return this.count / this.bucketCount;
  }

  /** Rehash into a larger table. Time: O(n). Space: O(n). */
  resize(newBuckets: number): void {
    const old = this.buckets;
    const oldCount = this.bucketCount;
    this.buckets = new Array<HashEntry<T> | null>(newBuckets).fill(null);
    this.bucketCount = newBuckets;
    let moved = 0;
    for (let i = 0; i < old.length; i++) {
      let cur = old[i];
      while (cur !== null) {
        const next = cur.next;
        const idx = this.hash(cur.key);
        cur.next = this.buckets[idx];
        this.buckets[idx] = cur;
        moved++;
        cur = next;
      }
    }
    this.emit("resize", `${oldCount} -> ${newBuckets} buckets, ${moved} rehashed`, "O(n)", moved);
  }

  size(): number {
    return this.count;
  }

  /** Bucket chains for visualisation. Time: O(n). Space: O(n). */
  chains(): { index: number; keys: string[] }[] {
    const out: { index: number; keys: string[] }[] = [];
    for (let i = 0; i < this.bucketCount; i++) {
      const keys: string[] = [];
      let cur = this.buckets[i];
      while (cur !== null) {
        keys.push(cur.key);
        cur = cur.next;
      }
      out.push({ index: i, keys });
    }
    return out;
  }
}