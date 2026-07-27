import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NAV_ITEMS } from "./nav";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useVault } from "@/lib/store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { regenerate, stressTest, toggleTheme } = useVault();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a module or run an action…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Modules">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.to} value={`${item.label} ${item.hint}`} onSelect={() => run(() => navigate({ to: item.to }))}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick actions">
          <CommandItem
            value="regenerate demo data"
            onSelect={() => run(() => { regenerate(); toast.success("Demo data regenerated"); })}
          >
            Regenerate demo data
          </CommandItem>
          <CommandItem
            value="stress test 1000 accounts"
            onSelect={() =>
              run(() => {
                const ms = stressTest(1000);
                toast.success(`Inserted 1,000 accounts into the BST in ${ms.toFixed(1)} ms`);
              })
            }
          >
            Stress test: add 1,000 accounts
          </CommandItem>
          <CommandItem value="toggle theme" onSelect={() => run(toggleTheme)}>
            Toggle light / dark theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}