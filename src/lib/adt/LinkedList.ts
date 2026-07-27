import { operationBus } from "./operationBus";

export class LLNode<T> {
  value: T;
  next: LLNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

/** Singly linked list, hand-written with node pointers (no array delegation). */
export class LinkedList<T> {
  head: LLNode<T> | null = null;
  private count = 0;
  constructor(public label = "LinkedList") {}

  private emit(method: string, detail: string, complexity: string, comparisons = 0, instructions = 1) {
    operationBus.emit({ structure: "list", method, detail, complexity, comparisons, instructions, ok: true });
  }

  /** Insert at head. Time: O(1). Space: O(1). */
  insertAtHead(value: T): LLNode<T> {
    const node = new LLNode(value);
    node.next = this.head;
    this.head = node;
    this.count++;
    this.emit("insertAtHead", String(value), "O(1)");
    return node;
  }

  /** Insert at tail by walking pointers. Time: O(n). Space: O(1). */
  insertAtTail(value: T): LLNode<T> {
    const node = new LLNode(value);
    let steps = 1;
    if (this.head === null) {
      this.head = node;
    } else {
      let cur = this.head;
      while (cur.next !== null) {
        cur = cur.next;
        steps++;
      }
      cur.next = node;
    }
    this.count++;
    this.emit("insertAtTail", String(value), "O(n)", 0, steps);
    return node;
  }

  /** Insert at 0-based position. Time: O(n). Space: O(1). */
  insertAtPosition(value: T, position: number): LLNode<T> | null {
    if (position <= 0) return this.insertAtHead(value);
    let cur = this.head;
    let i = 0;
    let steps = 0;
    while (cur !== null && i < position - 1) {
      cur = cur.next;
      i++;
      steps++;
    }
    if (cur === null) return this.insertAtTail(value);
    const node = new LLNode(value);
    node.next = cur.next;
    cur.next = node;
    this.count++;
    this.emit("insertAtPosition", `${String(value)} @ ${position}`, "O(n)", 0, steps + 1);
    return node;
  }

  /** Delete first node matching key predicate. Time: O(n). Space: O(1). */
  deleteByKey(match: (v: T) => boolean): T | null {
    let prev: LLNode<T> | null = null;
    let cur = this.head;
    let comparisons = 0;
    while (cur !== null) {
      comparisons++;
      if (match(cur.value)) {
        if (prev === null) this.head = cur.next;
        else prev.next = cur.next;
        cur.next = null;
        this.count--;
        this.emit("deleteByKey", String(cur.value), "O(n)", comparisons, comparisons);
        return cur.value;
      }
      prev = cur;
      cur = cur.next;
    }
    this.emit("deleteByKey", "no match", "O(n)", comparisons, comparisons);
    return null;
  }

  /** Visit every node. Time: O(n). Space: O(1). */
  traverse(visit: (v: T, index: number) => void): void {
    let cur = this.head;
    let i = 0;
    while (cur !== null) {
      visit(cur.value, i++);
      cur = cur.next;
    }
    this.emit("traverse", `${i} nodes`, "O(n)", 0, i);
  }

  /** Linear predicate search. Time: O(n). Space: O(1). */
  findByPredicate(match: (v: T) => boolean): T | null {
    let cur = this.head;
    let comparisons = 0;
    while (cur !== null) {
      comparisons++;
      if (match(cur.value)) {
        this.emit("findByPredicate", `hit after ${comparisons}`, "O(n)", comparisons, comparisons);
        return cur.value;
      }
      cur = cur.next;
    }
    this.emit("findByPredicate", `miss after ${comparisons}`, "O(n)", comparisons, comparisons);
    return null;
  }

  /** Iterative pointer reversal. Time: O(n). Space: O(1). */
  reverse(): void {
    let prev: LLNode<T> | null = null;
    let cur = this.head;
    let steps = 0;
    while (cur !== null) {
      const next: LLNode<T> | null = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
      steps++;
    }
    this.head = prev;
    this.emit("reverse", `${steps} pointers rewired`, "O(n)", 0, steps);
  }

  /** Cached node count. Time: O(1). Space: O(1). */
  size(): number {
    return this.count;
  }

  /** Materialise nodes into an array. Time: O(n). Space: O(n). */
  toArray(): T[] {
    const out: T[] = [];
    let cur = this.head;
    let i = 0;
    while (cur !== null) {
      out[i++] = cur.value;
      cur = cur.next;
    }
    return out;
  }
}