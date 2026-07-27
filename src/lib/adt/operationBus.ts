/**
 * Global operation bus. Every hand-written ADT method emits into this bus so the
 * UI can animate, count and log the operation in real time.
 */

export type Complexity = "O(1)" | "O(log n)" | "O(n)" | "O(n log n)" | "O(n²)" | "O(V·E)" | "O((V+E) log n)";

export interface OperationEvent {
  id: number;
  ts: number;
  structure: string;
  method: string;
  detail: string;
  complexity: string;
  comparisons: number;
  instructions: number;
  ok: boolean;
}

export interface BusStats {
  operations: number;
  comparisons: number;
  instructions: number;
}

type Listener = (e: OperationEvent) => void;

class OperationBus {
  private listeners = new Set<Listener>();
  private seq = 0;
  log: OperationEvent[] = [];
  stats: BusStats = { operations: 0, comparisons: 0, instructions: 0 };
  maxLog = 500;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(e: Omit<OperationEvent, "id" | "ts"> & Partial<Pick<OperationEvent, "ts">>) {
    const evt: OperationEvent = {
      id: ++this.seq,
      ts: e.ts ?? Date.now(),
      structure: e.structure,
      method: e.method,
      detail: e.detail,
      complexity: e.complexity,
      comparisons: e.comparisons ?? 0,
      instructions: e.instructions ?? 1,
      ok: e.ok ?? true,
    };
    this.stats = {
      operations: this.stats.operations + 1,
      comparisons: this.stats.comparisons + evt.comparisons,
      instructions: this.stats.instructions + evt.instructions,
    };
    this.log.push(evt);
    if (this.log.length > this.maxLog) this.log.splice(0, this.log.length - this.maxLog);
    this.listeners.forEach((l) => l(evt));
    return evt;
  }

  reset() {
    this.log = [];
    this.stats = { operations: 0, comparisons: 0, instructions: 0 };
  }

  toCsv(): string {
    const rows = [
      "id,timestamp,structure,method,detail,complexity,comparisons,instructions,status",
      ...this.log.map((e) =>
        [
          e.id,
          new Date(e.ts).toISOString(),
          e.structure,
          e.method,
          `"${e.detail.replace(/"/g, "'")}"`,
          e.complexity,
          e.comparisons,
          e.instructions,
          e.ok ? "ok" : "error",
        ].join(","),
      ),
    ];
    return rows.join("\n");
  }
}

export const operationBus = new OperationBus();

export function complexityTone(c: string): "green" | "blue" | "amber" | "red" | "slate" {
  if (c === "O(1)") return "green";
  if (c.includes("log n") && !c.includes("n log n")) return "blue";
  if (c === "O(n log n)") return "blue";
  if (c === "O(n²)" || c === "O(V·E)") return "red";
  if (c.includes("n")) return "amber";
  return "slate";
}