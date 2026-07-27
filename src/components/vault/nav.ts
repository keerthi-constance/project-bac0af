import {
  Boxes,
  Gauge,
  GitBranch,
  History,
  LayoutGrid,
  Layers,
  Search,
  ShieldCheck,
  Terminal,
  Timer,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Command Deck", icon: Gauge, hint: "Dashboard overview" },
  { to: "/accounts", label: "Accounts", icon: Users, hint: "Linked-list account registry" },
  { to: "/transactions", label: "Transaction Console", icon: LayoutGrid, hint: "Deposit, withdraw, transfer" },
  { to: "/history", label: "Time Machine", icon: History, hint: "Undo / redo stacks" },
  { to: "/service-desk", label: "Branch Floor", icon: Layers, hint: "Circular queue + heap" },
  { to: "/search", label: "Lookup Lab", icon: Search, hint: "Race four search strategies" },
  { to: "/sorting", label: "Sorting Arena", icon: Timer, hint: "Race sorting algorithms" },
  { to: "/network", label: "Routing Map", icon: GitBranch, hint: "Dijkstra vs Bellman-Ford" },
  { to: "/call-stack", label: "Under the Hood", icon: Boxes, hint: "Recursion call stack" },
  { to: "/playground", label: "Sandbox", icon: Terminal, hint: "Free-play ADT console" },
  { to: "/tests", label: "Verification Suite", icon: ShieldCheck, hint: "Run the test console" },
] as const;