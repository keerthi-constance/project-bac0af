import { useEffect, useState } from "react";
import { operationBus, type BusStats, type OperationEvent } from "@/lib/adt/operationBus";

export function useOperationBus() {
  const [last, setLast] = useState<OperationEvent | null>(null);
  const [stats, setStats] = useState<BusStats>({ operations: 0, comparisons: 0, instructions: 0 });
  const [log, setLog] = useState<OperationEvent[]>([]);

  useEffect(() => {
    setLast(operationBus.log[operationBus.log.length - 1] ?? null);
    setStats({ ...operationBus.stats });
    setLog([...operationBus.log].reverse());
    let frame = 0;
    const unsub = operationBus.subscribe(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setLast(operationBus.log[operationBus.log.length - 1] ?? null);
        setStats({ ...operationBus.stats });
        setLog([...operationBus.log].reverse());
      });
    });
    return () => {
      unsub();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { last, stats, log };
}