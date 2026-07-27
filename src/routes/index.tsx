import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Layers, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ComplexityBadge } from "@/components/vault/ComplexityBadge";
import { CountUp } from "@/components/vault/CountUp";
import { PageShell, Panel } from "@/components/vault/PageShell";
import { useOperationBus } from "@/components/vault/useOperationBus";
import { Button } from "@/components/ui/button";
import { formatCompactLKR, formatDateTime, formatLKR } from "@/lib/format";
import { useVault } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Deck — VaultCore Banking Terminal" },
      {
        name: "description",
        content:
          "Live banking command deck: animated ADT widgets, transaction ticker, 30-day balance chart and a full operation trace.",
      },
      { property: "og:title", content: "Command Deck — VaultCore Banking Terminal" },
      {
        property: "og:description",
        content: "Animated data-structure widgets and live banking metrics powered by hand-written ADTs.",
      },
    ],
  }),
  component: Dashboard,
});

const DAY = 86_400_000;

function Metric({
  icon: Icon,
  label,
  value,
  decimals = 0,
  prefix = "",
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="panel p-4"
    >
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="money mt-3 text-2xl font-semibold">
        <CountUp value={value} decimals={decimals} prefix={prefix} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}

function Dashboard() {
  const vault = useVault();
  const { accounts, transactions, undoStack, fifoQueue, priorityQueue, list, version, errors } = vault;
  const { log } = useOperationBus();
  const [showErrors, setShowErrors] = useState(true);

  const totals = useMemo(() => {
    let assets = 0;
    for (let i = 0; i < accounts.length; i++) assets += accounts[i].balance;
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    let todayVolume = 0;
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].at >= startOfDay) todayVolume += transactions[i].amount;
    }
    return { assets, todayVolume };
  }, [accounts, transactions]);

  const chartData = useMemo(() => {
    const now = Date.now();
    const buckets: { day: string; volume: number; balance: number }[] = [];
    let running = totals.assets;
    const deltas: number[] = new Array(30).fill(0);
    const volumes: number[] = new Array(30).fill(0);
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const daysAgo = Math.floor((now - t.at) / DAY);
      if (daysAgo < 0 || daysAgo > 29) continue;
      volumes[29 - daysAgo] += t.amount;
      const delta = t.type === "Deposit" ? t.amount : t.type === "Withdrawal" ? -t.amount : 0;
      deltas[29 - daysAgo] += delta;
    }
    const balances: number[] = new Array(30).fill(0);
    for (let i = 29; i >= 0; i--) {
      balances[i] = running;
      running -= deltas[i];
    }
    for (let i = 0; i < 30; i++) {
      const d = new Date(now - (29 - i) * DAY);
      buckets.push({
        day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        volume: volumes[i],
        balance: balances[i],
      });
    }
    return buckets;
  }, [transactions, totals.assets]);

  const ticker = useMemo(() => transactions.slice(-24).reverse(), [transactions]);
  const heap = priorityQueue.toArray();
  const chain = list.toArray().slice(0, 6);
  const stackDepth = undoStack.size();
  const queueSlots = fifoQueue.slots();

  return (
    <PageShell
      title="Command Deck"
      subtitle="Every number below is derived by walking a hand-written data structure."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Accounts" value={accounts.length} hint="Nodes in the account linked list" />
        <Metric
          icon={Wallet}
          label="Total assets"
          value={totals.assets}
          decimals={2}
          prefix="LKR "
          hint="Sum via full list traversal — O(n)"
        />
        <Metric
          icon={ArrowUpRight}
          label="Today's volume"
          value={totals.todayVolume}
          decimals={2}
          prefix="LKR "
          hint="Ledger scan since midnight"
        />
        <Metric
          icon={Layers}
          label="Queue depth"
          value={fifoQueue.size() + priorityQueue.size()}
          hint="FIFO ring + priority heap"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4" data-tour="widgets">
        <Panel title="Undo stack depth">
          <div className="flex h-28 items-end gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: i < stackDepth ? `${30 + ((i * 13) % 65)}%` : "8%",
                  opacity: i < stackDepth ? 1 : 0.25,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`flex-1 rounded-sm ${i < stackDepth ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="mono mt-2 text-xs text-muted-foreground">
            top = {undoStack.topIndex()} / {undoStack.capacity}
          </p>
        </Panel>

        <Panel title="Circular queue ring">
          <div className="relative mx-auto size-28">
            {queueSlots.map((slot, i) => {
              const angle = (i / queueSlots.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + 42 * Math.cos(angle);
              const y = 50 + 42 * Math.sin(angle);
              const filled = slot !== undefined;
              return (
                <motion.span
                  key={i}
                  animate={{ scale: filled ? 1 : 0.7, opacity: filled ? 1 : 0.35 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    filled ? "bg-primary glow-teal" : "border border-border bg-transparent"
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              );
            })}
            <div className="mono absolute inset-0 flex items-center justify-center text-sm">
              {fifoQueue.size()}/{fifoQueue.capacity}
            </div>
          </div>
          <p className="mono mt-2 text-center text-xs text-muted-foreground">
            front {fifoQueue.frontIndex()} · rear {fifoQueue.rearIndex()}
          </p>
        </Panel>

        <Panel title="Priority heap">
          <div className="flex h-28 items-end gap-1">
            {heap.slice(0, 14).map((e, i) => (
              <motion.div
                key={`${e.seq}-${i}`}
                layout
                initial={{ height: 0 }}
                animate={{ height: `${100 - e.priority * 28}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`flex-1 rounded-sm ${
                  e.priority === 0 ? "bg-gold" : e.priority === 1 ? "bg-coral" : "bg-muted-foreground/50"
                }`}
              />
            ))}
            {heap.length === 0 && <p className="text-xs text-muted-foreground">heap empty</p>}
          </div>
          <p className="mono mt-2 text-xs text-muted-foreground">size = {priorityQueue.size()}</p>
        </Panel>

        <Panel title="Account chain">
          <div className="flex h-28 flex-wrap items-center gap-1 overflow-hidden">
            <span className="mono text-[10px] text-primary">HEAD</span>
            {chain.map((a) => (
              <motion.span
                key={`${a.number}-${version}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mono rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px]"
              >
                {a.number}
              </motion.span>
            ))}
            <span className="mono text-[10px] text-muted-foreground">→ NULL</span>
          </div>
          <p className="mono mt-2 text-xs text-muted-foreground">size = {list.size()}</p>
        </Panel>
      </div>

      <div className="panel mt-4 overflow-hidden py-2">
        <motion.div
          className="flex gap-6 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {[...ticker, ...ticker].map((t, i) => (
            <span key={`${t.id}-${i}`} className="mono flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{t.id}</span>
              {t.type === "Withdrawal" ? (
                <ArrowDownRight className="size-3 text-coral" />
              ) : (
                <ArrowUpRight className="size-3 text-primary" />
              )}
              <span>{t.type}</span>
              <span className="money">{formatCompactLKR(t.amount)}</span>
              <span className={t.status === "Completed" ? "text-primary" : "text-coral"}>{t.status}</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="30-day balance trend" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={4} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => formatCompactLKR(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatLKR(v)}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--teal)"
                  strokeWidth={2}
                  fill="url(#bal)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel
            title="Error log"
            right={
              <Button size="sm" variant="ghost" onClick={() => setShowErrors((s) => !s)}>
                {showErrors ? "Hide" : "Show"}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {showErrors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="max-h-40 space-y-2 overflow-y-auto"
                >
                  {errors.length === 0 && <p className="text-xs text-muted-foreground">No errors recorded.</p>}
                  {errors.slice(0, 20).map((e) => (
                    <div key={e.id} className="rounded-lg border border-coral/30 bg-coral/5 p-2">
                      <p className="mono flex items-center gap-1 text-[11px] text-coral">
                        <AlertTriangle className="size-3" /> {e.type}
                      </p>
                      <p className="text-xs text-foreground/80">{e.message}</p>
                      <p className="mono text-[10px] text-muted-foreground">
                        {formatDateTime(e.at)} · {e.operation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <Panel title="Recent operations">
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {log.slice(0, 25).map((e) => (
                <div key={e.id} className="mono flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground">#{e.id}</span>
                  <span className="truncate text-primary">
                    {e.structure}.{e.method}
                  </span>
                  <ComplexityBadge value={e.complexity} className="ml-auto" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
