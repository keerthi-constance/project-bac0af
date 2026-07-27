import { cn } from "@/lib/utils";
import { complexityTone } from "@/lib/adt/operationBus";

const TONES: Record<string, string> = {
  green: "border-primary/40 bg-primary/10 text-primary",
  blue: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  amber: "border-gold/40 bg-gold/10 text-gold",
  red: "border-coral/40 bg-coral/10 text-coral",
  slate: "border-border bg-muted text-muted-foreground",
};

export function ComplexityBadge({ value, className }: { value: string; className?: string }) {
  const tone = complexityTone(value);
  return (
    <span
      className={cn(
        "mono inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] leading-none",
        TONES[tone],
        className,
      )}
    >
      {value}
    </span>
  );
}