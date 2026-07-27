import { StackOverflowError, StackUnderflowError } from "./errors";
import { operationBus } from "./operationBus";

/** Array-backed stack with an explicit top pointer and fixed capacity. */
export class Stack<T> {
  private items: (T | undefined)[];
  private top = -1;
  readonly capacity: number;

  constructor(capacity = 50, public label = "Stack") {
    this.capacity = capacity;
    this.items = new Array<T | undefined>(capacity);
  }

  private emit(method: string, detail: string, complexity: string, ok = true) {
    operationBus.emit({ structure: "stack", method, detail, complexity, comparisons: 0, instructions: 1, ok });
  }

  /** Push onto top. Throws StackOverflowError when full. Time: O(1). Space: O(1). */
  push(item: T): void {
    if (this.isFull()) {
      this.emit("push", "overflow", "O(1)", false);
      throw new StackOverflowError(`Stack overflow: capacity ${this.capacity} reached`);
    }
    this.top = this.top + 1;
    this.items[this.top] = item;
    this.emit("push", String(item), "O(1)");
  }

  /** Pop the top. Throws StackUnderflowError when empty. Time: O(1). Space: O(1). */
  pop(): T {
    if (this.isEmpty()) {
      this.emit("pop", "underflow", "O(1)", false);
      throw new StackUnderflowError();
    }
    const item = this.items[this.top] as T;
    this.items[this.top] = undefined;
    this.top = this.top - 1;
    this.emit("pop", String(item), "O(1)");
    return item;
  }

  /** Read the top without removing. Time: O(1). Space: O(1). */
  peek(): T | null {
    if (this.isEmpty()) return null;
    return this.items[this.top] as T;
  }

  /** Time: O(1). Space: O(1). */
  isEmpty(): boolean {
    return this.top === -1;
  }

  /** Time: O(1). Space: O(1). */
  isFull(): boolean {
    return this.top === this.capacity - 1;
  }

  /** Time: O(1). Space: O(1). */
  size(): number {
    return this.top + 1;
  }

  /** Top index pointer. Time: O(1). Space: O(1). */
  topIndex(): number {
    return this.top;
  }

  /** Bottom -> top snapshot. Time: O(n). Space: O(n). */
  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i <= this.top; i++) out[i] = this.items[i] as T;
    return out;
  }

  /** Empty the stack. Time: O(n). Space: O(1). */
  clear(): void {
    for (let i = 0; i <= this.top; i++) this.items[i] = undefined;
    this.top = -1;
  }
}