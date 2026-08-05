import { useState } from "react";
import { motion } from "framer-motion";
import { Database, KeyRound, Layers, Rows3, Search, Table2, Link2, HardDrive } from "lucide-react";
import { TABLES, SCHEMAS } from "@/lib/sandbox";
import { formatBytes, formatFullNumber } from "@/lib/format";
import { WorkspaceHeader, stagger } from "../Common";
import { Meter } from "../Charts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SCHEMA_TONE: Record<string, string> = {
  auth: "from-blue-500/15 text-blue-500",
  commerce: "from-violet-500/15 text-violet-500",
  logistics: "from-amber-500/15 text-amber-500",
  analytics: "from-emerald-500/15 text-emerald-500",
  audit: "from-rose-500/15 text-rose-500",
};

export function TablesWorkspace({ onRun }: { onRun: (cmd: string) => void }) {
  const [q, setQ] = useState("");
  const [schema, setSchema] = useState<string | null>(null);

  const tables = TABLES.filter(
    (t) => (!schema || t.schema === schema) && (t.name.includes(q.toLowerCase()) || t.schema.includes(q.toLowerCase())),
  );
  const maxRows = Math.max(...TABLES.map((t) => t.rowCount));

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Table2}
        title="Tables"
        subtitle={`${TABLES.length} tables across ${SCHEMAS.length} schemas`}
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tables…" className="h-9 w-full pl-9 sm:w-56" />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSchema(null)}
          className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", !schema ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
        >
          All schemas
        </button>
        {SCHEMAS.map((s) => (
          <button
            key={s.name}
            onClick={() => setSchema(s.name)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", schema === s.name ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            {s.name}
          </button>
        ))}
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        key={schema ?? "all"}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        {tables.map((t) => {
          const tone = SCHEMA_TONE[t.schema] ?? "from-primary/15 text-primary";
          const fkCount = t.columns.filter((c) => c.isForeignKey).length;
          return (
            <motion.button
              layout
              variants={stagger.item}
              key={`${t.schema}.${t.name}`}
              onClick={() => onRun(`Describe the ${t.name} table`)}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-elegant"
            >
              <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-60", tone)} />
              <div className="relative flex items-start justify-between">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br to-card", tone)}>
                  <Table2 className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {!t.hasPrimaryKey && <Badge variant="warning" className="px-1.5">no PK</Badge>}
                  <Badge variant="secondary" className="font-mono lowercase">{t.schema}</Badge>
                </div>
              </div>

              <div className="relative mt-4">
                <h3 className="font-mono text-base font-semibold">{t.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
              </div>

              <div className="relative mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Rows3 className="h-3.5 w-3.5" />{formatFullNumber(t.rowCount)} rows</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><HardDrive className="h-3.5 w-3.5" />{formatBytes(t.sizeBytes)}</span>
                </div>
                <Meter value={(t.rowCount / maxRows) * 100} tone="hsl(var(--primary))" />
              </div>

              <div className="relative mt-4 flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{t.columns.length} cols</span>
                <span className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" />{t.indexes.length} idx</span>
                {fkCount > 0 && <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{fkCount} fk</span>}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
