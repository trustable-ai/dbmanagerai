import { motion } from "framer-motion";
import { Boxes, ChevronsLeft, Database } from "lucide-react";
import { useStudio } from "@/hooks/use-studio";
import { NAV, type NavItem } from "./nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { intent, run, sidebarCollapsed, toggleSidebar } = useStudio();
  const collapsed = sidebarCollapsed;

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
          <Database className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">Nuvola Studio</div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">PostgreSQL workspace</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 no-scrollbar">
        <NavGroup title="Workspace" collapsed={collapsed} items={NAV.filter((n) => n.group === "workspace")} activeKind={intent.kind} onRun={run} />
        <NavGroup title="Intelligence" collapsed={collapsed} items={NAV.filter((n) => n.group === "intelligence")} activeKind={intent.kind} onRun={run} />
      </nav>

      {/* Sandbox footer + collapse */}
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <button
          onClick={() => run("Show connections")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
        >
          <Boxes className="h-4 w-4 shrink-0 text-primary" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Sandbox DB</div>
              <div className="flex items-center gap-1 text-[11px] text-sidebar-foreground/60">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />connected · 200 MB
              </div>
            </div>
          )}
        </button>
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white"
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}

function NavGroup({
  title,
  items,
  collapsed,
  activeKind,
  onRun,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  activeKind: string;
  onRun: (cmd: string) => void;
}) {
  return (
    <div>
      {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{title}</p>}
      <div className="space-y-1">
        {items.map((item) => {
          const active = activeKind === item.kind;
          return (
            <button
              key={item.kind}
              onClick={() => onRun(item.command)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white",
              )}
            >
              {active && <motion.span layoutId="nav-active" className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />}
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
