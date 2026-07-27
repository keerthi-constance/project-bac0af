import { Outlet } from "@tanstack/react-router";
import { Command, Moon, RefreshCw, Sun, Zap } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "./CommandPalette";
import { GuidedTour } from "./GuidedTour";
import { OperationHud } from "./OperationHud";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useVault, type AnimationSpeed } from "@/lib/store";

export function AppLayout() {
  const { speed, setSpeed, theme, toggleTheme, regenerate, stressTest } = useVault();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur">
            <SidebarTrigger />
            <span className="mono hidden text-[11px] uppercase tracking-widest text-muted-foreground md:inline">
              VaultCore · Banking Transaction Management
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="mono hidden items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground lg:inline-flex">
                <Command className="size-3" /> K
              </span>
              <Select value={speed} onValueChange={(v) => setSpeed(v as AnimationSpeed)}>
                <SelectTrigger className="mono h-8 w-[132px] text-xs">
                  <Zap className="size-3.5 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Motion: Off</SelectItem>
                  <SelectItem value="slow">Motion: Slow</SelectItem>
                  <SelectItem value="normal">Motion: Normal</SelectItem>
                  <SelectItem value="fast">Motion: Fast</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  regenerate();
                  toast.success("Demo data regenerated");
                }}
              >
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ms = stressTest(1000);
                  toast.success(`1,000 accounts indexed into the BST in ${ms.toFixed(1)} ms`);
                }}
              >
                <span className="mono text-xs">+1k</span>
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <OperationHud />
      <CommandPalette />
      <GuidedTour />
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}