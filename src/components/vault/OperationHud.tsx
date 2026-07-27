import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronUp, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { ComplexityBadge } from "./ComplexityBadge";
import { useOperationBus } from "./useOperationBus";
import { Button } from "@/components/ui/button";
import { operationBus } from "@/lib/adt/operationBus";
import { downloadFile } from "@/lib/format";

export function OperationHud() {
  const { last, stats, log } = useOperationBus();
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-stretch" data-tour="hud">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto overflow-hidden border-t border-border bg-card/95 backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="mono text-xs uppercase tracking-widest text-muted-foreground">Operation Log</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadFile("vaultcore-operations.csv", operationBus.toCsv())}
                >
                  <Download className="size-3.5" /> CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={() => operationBus.reset()}>
                  <Trash2 className="size-3.5" /> Clear
                </Button>
              </div>
            </div>
            <div className="h-[232px] overflow-y-auto px-2 py-1">
              {log.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No operations recorded yet.</p>
              )}
              {log.map((e) => (
                <div
                  key={e.id}
                  className="mono flex items-center gap-3 border-b border-border/50 px-2 py-1.5 text-xs"
                >
                  <span className="w-14 shrink-0 text-muted-foreground">#{e.id}</span>
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {new Date(e.ts).toLocaleTimeString("en-GB")}
                  </span>
                  <span className={e.ok ? "text-primary" : "text-coral"}>
                    {e.structure}.{e.method}
                  </span>
                  <span className="flex-1 truncate text-foreground/80">{e.detail}</span>
                  <span className="shrink-0 text-muted-foreground">{e.comparisons} cmp</span>
                  <ComplexityBadge value={e.complexity} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto flex items-center gap-3 border-t border-border bg-card/95 px-4 py-2 backdrop-blur">
        <Activity className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={last?.id ?? "idle"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <code className="mono truncate rounded-md border border-border bg-muted px-2 py-1 text-xs">
                {last ? `${last.structure}.${last.method}(${last.detail})` : "awaiting first operation…"}
              </code>
              {last && <ComplexityBadge value={last.complexity} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mono hidden shrink-0 items-center gap-4 text-[11px] text-muted-foreground sm:flex">
          <span>
            ops <span className="text-foreground">{stats.operations.toLocaleString()}</span>
          </span>
          <span>
            cmp <span className="text-foreground">{stats.comparisons.toLocaleString()}</span>
          </span>
          <span>
            instr <span className="text-foreground">{stats.instructions.toLocaleString()}</span>
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="inline-flex">
            <ChevronUp className="size-4" />
          </motion.span>
          <span className="hidden sm:inline">Log</span>
        </Button>
      </div>
    </div>
  );
}