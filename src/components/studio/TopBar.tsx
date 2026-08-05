import { useState } from "react";
import { Database, Menu, Moon, Search, Sun } from "lucide-react";
import { useStudio } from "@/hooks/use-studio";
import { NAV } from "./nav";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { intent, run, theme, toggleTheme } = useStudio();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl">
      {/* Mobile menu */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Jump to a workspace</SheetDescription>
          <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white">
              <Database className="h-5 w-5" />
            </div>
            <div className="text-sm font-bold text-white">Nuvola Studio</div>
          </div>
          <nav className="space-y-1 p-3">
            {NAV.map((item) => (
              <button
                key={item.kind}
                onClick={() => {
                  run(item.command);
                  setDrawerOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  intent.kind === item.kind ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", intent.kind === item.kind && "text-primary")} />
                {item.label}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb / title */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Sandbox DB</span>
        <span className="hidden text-muted-foreground/40 sm:inline">/</span>
        <span className="truncate text-sm font-semibold capitalize">{intent.kind.replace("-", " ")}</span>
      </div>

      <div className="flex-1" />

      {/* Command palette trigger */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="h-4 w-4" />
        <span>Jump to…</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
        MG
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onRun={run} />
    </header>
  );
}
