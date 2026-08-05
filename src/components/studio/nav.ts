import {
  Copy,
  GaugeCircle,
  KeyRound,
  Network,
  Plug,
  Rocket,
  Sparkles,
  Table2,
  Flame,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceKind } from "@/lib/intent";

export interface NavItem {
  kind: WorkspaceKind;
  label: string;
  command: string;
  icon: LucideIcon;
  group: "workspace" | "intelligence";
}

export const NAV: NavItem[] = [
  { kind: "overview", label: "Overview", command: "Show database overview", icon: GaugeCircle, group: "workspace" },
  { kind: "tables", label: "Tables", command: "Show tables", icon: Table2, group: "workspace" },
  { kind: "schema", label: "Schema", command: "Explain schema", icon: Network, group: "workspace" },
  { kind: "indexes", label: "Indexes", command: "Show indexes", icon: KeyRound, group: "workspace" },
  { kind: "connections", label: "Connections", command: "Show connections", icon: Plug, group: "workspace" },
  { kind: "insights", label: "AI Insights", command: "Show AI insights", icon: Sparkles, group: "intelligence" },
  { kind: "slow-queries", label: "Performance", command: "Show slow queries", icon: Flame, group: "intelligence" },
  { kind: "optimize", label: "Optimizer", command: "Optimize my slowest query", icon: Rocket, group: "intelligence" },
  { kind: "duplicates", label: "Duplicates", command: "Find duplicate records", icon: Copy, group: "intelligence" },
];
