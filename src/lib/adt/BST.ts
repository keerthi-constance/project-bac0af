import { operationBus } from "./operationBus";

export class BSTNode<T> {
  key: string;
  value: T;
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;
  constructor(key: string, value: T) {
    this.key = key;
    this.value = value;
  }
}

/** Binary search tree keyed on account number. */
export class BST<T> {
  root: BSTNode<T> | null = null;
  private count = 0;
  lastPath: string[] = [];

  private emit(method: string, detail: string, complexity: string, comparisons = 0) {
    operationBus.emit({
      structure: "bst",
      method,
      detail,
      complexity,
      comparisons,
      instructions: Math.max(1, comparisons),
      ok: true,
    });
  }

  /** Iterative insert. Time: O(log n) average / O(n) worst. Space: O(1). */
  insert(key: string, value: T): void {
    const node = new BSTNode(key, value);
    let comparisons = 0;
    if (this.root === null) {
      this.root = node;
      this.count++;
      this.emit("insert", key, "O(log n)", 1);
      return;
    }
    let cur = this.root;
    for (;;) {
      comparisons++;
      if (key < cur.key) {
        if (cur.left === null) {
          cur.left = node;
          break;
        }
        cur = cur.left;
      } else if (key > cur.key) {
        if (cur.right === null) {
          cur.right = node;
          break;
        }
        cur = cur.right;
      } else {
        cur.value = value;
        this.emit("insert", `${key} (updated)`, "O(log n)", comparisons);
        return;
      }
    }
    this.count++;
    this.emit("insert", key, "O(log n)", comparisons);
  }

  /** Iterative search recording the visited path. Time: O(log n) avg. Space: O(1). */
  search(key: string): { value: T | null; path: string[]; comparisons: number } {
    const path: string[] = [];
    let cur = this.root;
    let comparisons = 0;
    while (cur !== null) {
      path.push(cur.key);
      comparisons++;
      if (key === cur.key) {
        this.lastPath = path;
        this.emit("search", `${key} hit`, "O(log n)", comparisons);
        return { value: cur.value, path, comparisons };
      }
      cur = key < cur.key ? cur.left : cur.right;
    }
    this.lastPath = path;
    this.emit("search", `${key} miss`, "O(log n)", comparisons);
    return { value: null, path, comparisons };
  }

  /** In-order walk yielding sorted keys. Time: O(n). Space: O(h). */
  inOrder(): { key: string; value: T }[] {
    const out: { key: string; value: T }[] = [];
    const stack: BSTNode<T>[] = [];
    let cur = this.root;
    while (cur !== null || stack.length > 0) {
      while (cur !== null) {
        stack.push(cur);
        cur = cur.left;
      }
      const node = stack.pop() as BSTNode<T>;
      out.push({ key: node.key, value: node.value });
      cur = node.right;
    }
    this.emit("inOrder", `${out.length} keys`, "O(n)", out.length);
    return out;
  }

  /** Delete with in-order successor replacement. Time: O(log n) avg. Space: O(1). */
  delete(key: string): boolean {
    let parent: BSTNode<T> | null = null;
    let cur = this.root;
    let comparisons = 0;
    while (cur !== null && cur.key !== key) {
      comparisons++;
      parent = cur;
      cur = key < cur.key ? cur.left : cur.right;
    }
    if (cur === null) {
      this.emit("delete", `${key} miss`, "O(log n)", comparisons);
      return false;
    }
    if (cur.left !== null && cur.right !== null) {
      let succParent = cur;
      let succ = cur.right;
      while (succ.left !== null) {
        succParent = succ;
        succ = succ.left;
      }
      cur.key = succ.key;
      cur.value = succ.value;
      parent = succParent;
      cur = succ;
    }
    const child = cur.left !== null ? cur.left : cur.right;
    if (parent === null) this.root = child;
    else if (parent.left === cur) parent.left = child;
    else parent.right = child;
    this.count--;
    this.emit("delete", key, "O(log n)", comparisons);
    return true;
  }

  /** Recursive height. Time: O(n). Space: O(h). */
  height(node: BSTNode<T> | null = this.root): number {
    if (node === null) return 0;
    const l = this.height(node.left);
    const r = this.height(node.right);
    return 1 + (l > r ? l : r);
  }

  size(): number {
    return this.count;
  }
}