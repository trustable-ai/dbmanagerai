import { useEffect } from "react";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { NAV } from "./nav";
import { getTable } from "@/lib/intent";
import { TABLES } from "@/lib/sandbox";
import { SUGGESTIONS } from "@/lib/intent";

export function CommandPalette({
  open,
  onOpenChange,
  onRun,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRun: (cmd: string) => void;
}) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (cmd: string) => {
    onRun(cmd);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-xl -translate-x-1/2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command className="overflow-hidden rounded-2xl border bg-popover shadow-elegant">
            <div className="flex items-center gap-2 border-b px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Ask or jump to a workspace…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">No results.</Command.Empty>

              <Command.Group heading="Workspaces" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {NAV.map((n) => (
                  <Item key={n.kind} onSelect={() => go(n.command)}>
                    <n.icon className="h-4 w-4 text-muted-foreground" />
                    {n.label}
                  </Item>
                ))}
              </Command.Group>

              <Command.Group heading="Ask AI" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {SUGGESTIONS.slice(3, 8).map((s) => (
                  <Item key={s.command} onSelect={() => go(s.command)}>
                    <Search className="h-4 w-4 text-muted-foreground" />
                    {s.command}
                  </Item>
                ))}
              </Command.Group>

              <Command.Group heading="Tables" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {TABLES.map((t) => (
                  <Item key={t.name} value={`table ${t.schema} ${t.name}`} onSelect={() => go(`Describe the ${t.name} table`)}>
                    <span className="font-mono text-xs">{t.schema}.{t.name}</span>
                  </Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Item({ children, onSelect, value }: { children: React.ReactNode; onSelect: () => void; value?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      {children}
      <CornerDownLeft className="ml-auto h-3 w-3 text-muted-foreground opacity-0 data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
