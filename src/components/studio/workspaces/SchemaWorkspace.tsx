import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, KeyRound, Link2, Network, Table2, Workflow } from "lucide-react";
import { TABLES, SCHEMAS } from "@/lib/sandbox";
import type { TableInfo } from "@/lib/types";
import { formatFullNumber } from "@/lib/format";
import { WorkspaceHeader, SectionTitle } from "../Common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Collect all foreign-key relationships across the sandbox. */
function relationships() {
  const rels: { from: string; to: string; col: string }[] = [];
  for (const t of TABLES) {
    for (const c of t.columns) {
      if (c.isForeignKey && c.references) rels.push({ from: t.name, to: c.references.table, col: c.name });
    }
  }
  return rels;
}

export function SchemaWorkspace({ onRun }: { onRun: (cmd: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>("orders");
  const rels = relationships();

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Network}
        title="Schema Explorer"
        subtitle={`${TABLES.length} tables · ${rels.length} relationships`}
        actions={<Badge variant="info"><Workflow className="h-3 w-3" />interactive</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: expandable table list grouped by schema */}
        <div className="space-y-4 lg:col-span-2">
          {SCHEMAS.map((s) => (
            <Card key={s.name} className="overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-mono text-sm font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.description}</span>
                </div>
                <Badge variant="secondary">{s.tableCount}</Badge>
              </div>
              <div className="divide-y">
                {TABLES.filter((t) => t.schema === s.name).map((t) => (
                  <TableRow key={t.name} table={t} expanded={expanded === t.name} onToggle={() => setExpanded((e) => (e === t.name ? null : t.name))} onRun={onRun} />
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Right: relationship graph */}
        <div>
          <Card className="sticky top-4">
            <div className="p-5">
              <SectionTitle hint={`${rels.length} edges`}>Relationship graph</SectionTitle>
              <div className="space-y-2">
                {rels.map((r, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => onRun(`Describe the ${r.from} table`)}
                    className="flex w-full items-center gap-1.5 rounded-lg border bg-muted/20 px-2.5 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="rounded bg-card px-1.5 py-0.5 font-mono font-medium">{r.from}</span>
                    <Link2 className="h-3 w-3 shrink-0 text-primary" />
                    <span className="rounded bg-card px-1.5 py-0.5 font-mono font-medium">{r.to}</span>
                    <span className="ml-auto truncate text-muted-foreground">{r.col}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TableRow({ table, expanded, onToggle, onRun }: { table: TableInfo; expanded: boolean; onToggle: () => void; onRun: (c: string) => void }) {
  const fks = table.columns.filter((c) => c.isForeignKey);
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        <Table2 className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-medium">{table.name}</span>
        <span className="text-xs text-muted-foreground">{formatFullNumber(table.rowCount)} rows</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Badge variant="secondary" className="px-1.5">{table.columns.length} cols</Badge>
          {fks.length > 0 && <Badge variant="info" className="px-1.5"><Link2 className="h-3 w-3" />{fks.length}</Badge>}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-1 border-t bg-muted/20 px-4 py-3 sm:grid-cols-2">
              {table.columns.map((c) => (
                <div key={c.name} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
                  {c.isPrimaryKey ? (
                    <KeyRound className="h-3 w-3 shrink-0 text-warning" />
                  ) : c.isForeignKey ? (
                    <Link2 className="h-3 w-3 shrink-0 text-info" />
                  ) : (
                    <span className="h-3 w-3 shrink-0" />
                  )}
                  <span className="font-mono font-medium">{c.name}</span>
                  <span className="ml-auto font-mono text-muted-foreground">{c.type}</span>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-2">
              <button onClick={() => onRun(`Describe the ${table.name} table`)} className="text-xs font-medium text-primary hover:underline">
                Open full inspector →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
