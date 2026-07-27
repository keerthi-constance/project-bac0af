import { QueueOverflowError, QueueUnderflowError } from "./errors";
import { operationBus } from "./operationBus";

/** Circular array queue with front + rear pointers and modulo wrap-around. */
export class Queue<T> {
  private items: (T | undefined)[];
  private front = 0;
  private rear = -1;
  private count = 0;
  readonly capacity: number;

  constructor(capacity = 20, public label = "Queue") {
    this.capacity = capacity;
    this.items = new Array<T | undefined>(capacity);
  }

  private emit(method: string, detail: string, complexity: string, ok = true) {
    operationBus.emit({ structure: "queue", method, detail, complexity, comparisons: 0, instructions: 1, ok });
  }

  /** Enqueue at rear with modulo wrap. Time: O(1). Space: O(1). */
  enqueue(item: T): number {
    if (this.isFull()) {
      this.emit("enqueue", "overflow", "O(1)", false);
      throw new QueueOverflowError(`Queue overflow: capacity ${this.capacity} reached`);
    }
    this.rear = (this.rear + 1) % this.capacity;
    this.items[this.rear] = item;
    this.count++;
    this.emit("enqueue", `${String(item)} @ slot ${this.rear}`, "O(1)");
    return this.rear;
  }

  /** Dequeue from front with modulo wrap. Time: O(1). Space: O(1). */
  dequeue(): T {
    if (this.isEmpty()) {
      this.emit("dequeue", "underflow", "O(1)", false);
      throw new QueueUnderflowError();
    }
    const item = this.items[this.front] as T;
    this.items[this.front] = undefined;
    this.front = (this.front + 1) % this.capacity;
    this.count--;
    this.emit("dequeue", String(item), "O(1)");
    return item;
  }

  /** Time: O(1). Space: O(1). */
  peek(): T | null {
    if (this.isEmpty()) return null;
    return this.items[this.front] as T;
  }

  /** Time: O(1). Space: O(1). */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /** Time: O(1). Space: O(1). */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /** Time: O(1). Space: O(1). */
  size(): number {
    return this.count;
  }

  frontIndex(): number {
    return this.front;
  }
  rearIndex(): number {
    return this.rear;
  }

  /** Raw slot view for the ring visualisation. Time: O(n). Space: O(n). */
  slots(): (T | undefined)[] {
    const out: (T | undefined)[] = [];
    for (let i = 0; i < this.capacity; i++) out[i] = this.items[i];
    return out;
  }

  /** Logical front -> rear order. Time: O(n). Space: O(n). */
  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this.count; i++) out[i] = this.items[(this.front + i) % this.capacity] as T;
    return out;
  }
}