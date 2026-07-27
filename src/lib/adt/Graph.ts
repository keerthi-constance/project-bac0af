import { NegativeCycleError } from "./errors";
import { operationBus } from "./operationBus";

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface TraceStep {
  index: number;
  kind: "visit" | "relax" | "skip" | "done" | "iteration";
  from?: string;
  to?: string;
  weight?: number;
  distances: Record<string, number>;
  note: string;
}

export interface PathResult {
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  path: string[];
  cost: number;
  trace: TraceStep[];
  steps: number;
  negativeCycle: boolean;
}

/** Weighted directed/undirected graph stored as an adjacency list. */
export class Graph {
  adjacency = new Map<string, Edge[]>();

  private emit(method: string, detail: string, complexity: string, comparisons = 0) {
    operationBus.emit({
      structure: "graph",
      method,
      detail,
      complexity,
      comparisons,
      instructions: Math.max(1, comparisons),
      ok: true,
    });
  }

  /** Add a vertex. Time: O(1). Space: O(1). */
  addVertex(id: string): void {
    if (!this.adjacency.has(id)) this.adjacency.set(id, []);
  }

  /** Add a weighted edge (undirected by default). Time: O(1). Space: O(1). */
  addEdge(from: string, to: string, weight: number, undirected = true): void {
    this.addVertex(from);
    this.addVertex(to);
    (this.adjacency.get(from) as Edge[]).push({ from, to, weight });
    if (undirected) (this.adjacency.get(to) as Edge[]).push({ from: to, to: from, weight });
  }

  /** Flat edge list. Time: O(V+E). Space: O(E). */
  edges(): Edge[] {
    const out: Edge[] = [];
    this.adjacency.forEach((list) => {
      for (let i = 0; i < list.length; i++) out.push(list[i]);
    });
    return out;
  }

  vertices(): string[] {
    return Array.from(this.adjacency.keys());
  }

  private buildPath(previous: Record<string, string | null>, source: string, target: string): string[] {
    const path: string[] = [];
    let cur: string | null = target;
    while (cur !== null && cur !== undefined) {
      path.unshift(cur);
      if (cur === source) break;
      cur = previous[cur] ?? null;
    }
    return path[0] === source ? path : [];
  }

  /** Dijkstra with a linear-scan min extraction. Time: O((V+E) log V). Space: O(V). */
  dijkstra(source: string, target: string): PathResult {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const visited = new Set<string>();
    const trace: TraceStep[] = [];
    let steps = 0;

    this.vertices().forEach((v) => {
      distances[v] = v === source ? 0 : Infinity;
      previous[v] = null;
    });

    for (;;) {
      let best: string | null = null;
      let bestDist = Infinity;
      this.vertices().forEach((v) => {
        if (!visited.has(v) && distances[v] < bestDist) {
          bestDist = distances[v];
          best = v;
        }
      });
      if (best === null) break;
      const current: string = best;
      visited.add(current);
      steps++;
      trace.push({
        index: trace.length,
        kind: "visit",
        to: current,
        distances: { ...distances },
        note: `Visit ${current} (tentative distance ${bestDist === Infinity ? "∞" : bestDist})`,
      });
      const list = this.adjacency.get(current) ?? [];
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        steps++;
        const candidate = distances[current] + e.weight;
        if (candidate < distances[e.to]) {
          distances[e.to] = candidate;
          previous[e.to] = current;
          trace.push({
            index: trace.length,
            kind: "relax",
            from: current,
            to: e.to,
            weight: e.weight,
            distances: { ...distances },
            note: `Relax ${current} → ${e.to}: new distance ${candidate}`,
          });
        } else {
          trace.push({
            index: trace.length,
            kind: "skip",
            from: current,
            to: e.to,
            weight: e.weight,
            distances: { ...distances },
            note: `Skip ${current} → ${e.to}: ${candidate} not better than ${distances[e.to]}`,
          });
        }
      }
    }
    const path = this.buildPath(previous, source, target);
    trace.push({
      index: trace.length,
      kind: "done",
      distances: { ...distances },
      note: path.length ? `Shortest path: ${path.join(" → ")} = ${distances[target]}` : "No path found",
    });
    this.emit("dijkstra", `${source} → ${target}`, "O((V+E) log V)", steps);
    return { distances, previous, path, cost: distances[target], trace, steps, negativeCycle: false };
  }

  /** Bellman-Ford, V-1 relaxation passes + negative-cycle check. Time: O(V·E). Space: O(V). */
  bellmanFord(source: string, target: string): PathResult {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const trace: TraceStep[] = [];
    const verts = this.vertices();
    const edgeList = this.edges();
    let steps = 0;

    verts.forEach((v) => {
      distances[v] = v === source ? 0 : Infinity;
      previous[v] = null;
    });

    for (let pass = 1; pass < verts.length; pass++) {
      let changed = false;
      trace.push({
        index: trace.length,
        kind: "iteration",
        distances: { ...distances },
        note: `Pass ${pass} of ${verts.length - 1}`,
      });
      for (let i = 0; i < edgeList.length; i++) {
        const e = edgeList[i];
        steps++;
        if (distances[e.from] === Infinity) continue;
        const candidate = distances[e.from] + e.weight;
        if (candidate < distances[e.to]) {
          distances[e.to] = candidate;
          previous[e.to] = e.from;
          changed = true;
          trace.push({
            index: trace.length,
            kind: "relax",
            from: e.from,
            to: e.to,
            weight: e.weight,
            distances: { ...distances },
            note: `Relax ${e.from} → ${e.to}: new distance ${candidate}`,
          });
        }
      }
      if (!changed) break;
    }

    let negativeCycle = false;
    for (let i = 0; i < edgeList.length; i++) {
      const e = edgeList[i];
      if (distances[e.from] !== Infinity && distances[e.from] + e.weight < distances[e.to]) {
        negativeCycle = true;
        break;
      }
    }

    const path = negativeCycle ? [] : this.buildPath(previous, source, target);
    trace.push({
      index: trace.length,
      kind: "done",
      distances: { ...distances },
      note: negativeCycle
        ? "Negative-weight cycle detected — no finite shortest path"
        : path.length
          ? `Shortest path: ${path.join(" → ")} = ${distances[target]}`
          : "No path found",
    });
    this.emit("bellmanFord", `${source} → ${target}`, "O(V·E)", steps);
    return { distances, previous, path, cost: distances[target], trace, steps, negativeCycle };
  }

  /** Throws when a negative cycle exists. Time: O(V·E). Space: O(V). */
  assertNoNegativeCycle(source: string): void {
    const r = this.bellmanFord(source, source);
    if (r.negativeCycle) throw new NegativeCycleError();
  }
}