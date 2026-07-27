import { useEffect, useRef, useState } from "react";
import { useVault } from "@/lib/store";

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { animMs } = useVault();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const ms = animMs(duration);
    const from = fromRef.current;
    const to = value;
    if (ms <= 0 || from === to) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      fromRef.current = to;
    };
  }, [value, duration, animMs]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}