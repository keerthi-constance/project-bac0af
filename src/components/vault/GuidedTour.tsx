import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/store";

const STEPS = [
  {
    title: "Welcome to VaultCore",
    body: "A banking terminal where every operation runs on hand-written data structures — linked lists, stacks, heaps, trees and graphs, all animated as they mutate.",
  },
  {
    title: "Live ADT visualisations",
    body: "The Command Deck shows four mini-widgets: stack depth, the circular queue ring, the heap sparkline and the account chain. Each pulses the moment its structure changes.",
  },
  {
    title: "The operation HUD",
    body: "Along the bottom you'll always see the last ADT call as a code chip with its Big-O badge, plus running counters for operations, comparisons and instructions. Open the drawer for the full trace and CSV export.",
  },
  {
    title: "Sorting Arena",
    body: "Race bubble, insertion, merge and quick sort side by side on identical data, with a speed slider, step-through mode and a measured-vs-theoretical growth chart.",
  },
  {
    title: "Verification Suite",
    body: "Thirty test cases cover each ADT and each business rule, including deliberate failures like stack underflow and overdrafts. Run them all and export the report.",
  },
];

export function GuidedTour() {
  const { tourDone, completeTour } = useVault();
  const [step, setStep] = useState(0);
  if (tourDone) return null;
  const s = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="panel w-full max-w-lg p-6"
        >
          <p className="mono text-[11px] uppercase tracking-widest text-primary">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{s.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={completeTour}>
              Skip tour
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep((v) => v - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={() => (step === STEPS.length - 1 ? completeTour() : setStep((v) => v + 1))}>
                {step === STEPS.length - 1 ? "Start exploring" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}