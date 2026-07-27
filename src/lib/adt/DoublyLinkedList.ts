import { operationBus } from "./operationBus";

export class DLNode<T> {
  value: T;
  prev: DLNode<T> | null = null;
  next: DLNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

/** Doubly linked ledger: history can be walked in both directions. */
export class DoublyLinkedList<T> {
  head: DLNode<T> | null = null;
  tail: DLNode<T> | null = null;
  private count = 0;

  private emit(method: string, detail: string, complexity: string, instructions = 1) {
    operationBus.emit({ structure: "dlist", method, detail, complexity, comparisons: 0, instructions, ok: true });
  }

  /** Append using the tail pointer. Time: O(1). Space: O(1). */
  insertAtTail(value: T): DLNode<T> {
    const node = new DLNode(value);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.count++;
    this.emit("insertAtTail", String(value), "O(1)");
    return node;
  }

  /** Unlink a known node. Time: O(1). Space: O(1). */
  deleteNode(node: DLNode<T>): T {
    if (node.prev !== null) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next !== null) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
    this.count--;
    this.emit("deleteNode", String(node.value), "O(1)");
    return node.value;
  }

  /** Walk head -> tail. Time: O(n). Space: O(n). */
  traverseForward(): T[] {
    const out: T[] = [];
    let cur = this.head;
    let i = 0;
    while (cur !== null) {
      out[i++] = cur.value;
      cur = cur.next;
    }
    this.emit("traverseForward", `${i} nodes`, "O(n)", i);
    return out;
  }

  /** Walk tail -> head. Time: O(n). Space: O(n). */
  traverseBackward(): T[] {
    const out: T[] = [];
    let cur = this.tail;
    let i = 0;
    while (cur !== null) {
      out[i++] = cur.value;
      cur = cur.prev;
    }
    this.emit("traverseBackward", `${i} nodes`, "O(n)", i);
    return out;
  }

  /** Node count. Time: O(1). Space: O(1). */
  size(): number {
    return this.count;
  }

  /** Node list without emitting (for silent rendering). Time: O(n). Space: O(n). */
  nodes(): DLNode<T>[] {
    const out: DLNode<T>[] = [];
    let cur = this.head;
    while (cur !== null) {
      out.push(cur);
      cur = cur.next;
    }
    return out;
  }
}