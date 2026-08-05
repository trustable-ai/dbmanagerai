import { motion } from "framer-motion";
import {
  Braces,
  Database,
  Gauge,
  HardDrive,
  KeyRound,
  Link2,
  ListTree,
  Rows3,
  ShieldCheck,
  Table2,
} from "lucide-react";
import { getTable } from "@/lib/sandbox";
import { formatBytes, formatFullNumber } from "@/lib/format";
import { WorkspaceHeader, EmptyState, KeyVal, stagger } from "../Common";
import { StatCard } from "../StatCard";
import { DataTable } from "../DataTable";
import { SqlCard } from "../SqlCard";
import { Meter } from "../Charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function TableDetailWorkspace({ table: name, onRun }: { table?: string; onRun: (cmd: string) => void }) {
  const table = getTable(name ?? "");
  if (!table)
    return (
      <EmptyState
        icon={Table2}
        title="Table not found"
        description={`I couldn't find a table named "${name}". Try "show tables" to browse everything.`}
      />
    );

  const fks = table.columns.filter((c) => c.isForeignKey);
  const selectSql = `SELECT *\nFROM ${table.schema}.${table.name}\nLIMIT 100;`;

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Table2}
        title={table.name}
        subtitle={`${table.schema} · ${table.description}`}
        actions={
          <>
            <Badge variant="secondary" className="font-mono">{table.schema}</Badge>
            {table.hasPrimaryKey ? <Badge variant="success"><KeyRound className="h-3 w-3" />PK</Badge> : <Badge variant="warning">no PK</Badge>}
          </>
        }
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={stagger.item}><StatCard icon={Rows3} label="Rows" value={formatFullNumber(table.rowCount)} tone="primary" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={HardDrive} label="Total size" value={formatBytes(table.sizeBytes + table.indexSizeBytes)} hint={`${formatBytes(table.indexSizeBytes)} indexes`} tone="info" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Gauge} label="Bloat" value={`${table.bloatPercent}%`} tone={table.bloatPercent > 15 ? "warning" : "success"} /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={KeyRound} label="Indexes" value={`${table.indexes.length}`} hint={`${formatFullNumber(table.idxScans)} scans`} tone="info" /></motion.div>
      </motion.div>

      <Tabs defaultValue="columns">
        <TabsList className="flex-wrap">
          <TabsTrigger value="columns"><ListTree className="h-4 w-4" />Columns</TabsTrigger>
          <TabsTrigger value="indexes"><KeyRound className="h-4 w-4" />Indexes</TabsTrigger>
          <TabsTrigger value="constraints"><ShieldCheck className="h-4 w-4" />Constraints</TabsTrigger>
          <TabsTrigger value="relationships"><Link2 className="h-4 w-4" />Relationships</TabsTrigger>
          <TabsTrigger value="data"><Braces className="h-4 w-4" />Sample data</TabsTrigger>
        </TabsList>

        <TabsContent value="columns">
          <Card>
            <div className="divide-y">
              {table.columns.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.isPrimaryKey ? "bg-warning/12 text-warning" : c.isForeignKey ? "bg-info/12 text-info" : "bg-muted text-muted-foreground")}>
                    {c.isPrimaryKey ? <KeyRound className="h-4 w-4" /> : c.isForeignKey ? <Link2 className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                  </div>
                  <span className="font-mono text-sm font-semibold">{c.name}</span>
                  <Badge variant="secondary" className="font-mono">{c.type}</Badge>
                  {!c.nullable && <Badge variant="outline">NOT NULL</Badge>}
                  {c.unique && <Badge variant="info">UNIQUE</Badge>}
                  {c.defaultValue && <span className="font-mono text-xs text-muted-foreground">default {c.defaultValue}</span>}
                  {c.references && (
                    <span className="ml-auto font-mono text-xs text-info">→ {c.references.table}.{c.references.column}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="indexes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {table.indexes.map((idx) => (
              <Card key={idx.name} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">{idx.name}</span>
                  <Badge variant={idx.usage === "unused" ? "warning" : idx.usage === "high" ? "success" : "secondary"}>{idx.usage}</Badge>
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">({idx.columns.join(", ")}) · {idx.type}</div>
                <div className="mt-3 space-y-2">
                  <KeyVal label="Scans" value={formatFullNumber(idx.scans)} />
                  <KeyVal label="Size" value={formatBytes(idx.sizeBytes)} />
                  <Meter value={Math.min(100, (idx.scans / 90000) * 100)} tone={idx.usage === "unused" ? "hsl(var(--warning))" : "hsl(var(--success))"} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="constraints">
          <Card>
            <div className="divide-y">
              {table.constraints.map((c) => (
                <div key={c.name} className="flex items-center gap-3 px-5 py-3">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="font-mono text-sm font-medium">{c.name}</span>
                  <Badge variant="secondary">{c.type}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{c.columns.join(", ")}</span>
                  {c.detail && <span className="ml-auto text-xs text-muted-foreground">{c.detail}</span>}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          {fks.length === 0 ? (
            <EmptyState icon={Link2} title="No outbound relationships" description="This table has no foreign keys referencing other tables." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fks.map((c) => (
                <Card key={c.name} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/12 text-info"><Link2 className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      <span className="font-semibold">{table.name}.{c.name}</span>
                    </div>
                    <div className="font-mono text-xs text-info">→ {c.references?.table}.{c.references?.column}</div>
                  </div>
                  <button onClick={() => onRun(`Describe the ${c.references?.table} table`)} className="text-xs font-medium text-primary hover:underline">
                    Open
                  </button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <SqlCard sql={selectSql} title={`${table.schema}.${table.name}`} compact />
          <DataTable rows={table.sampleRows} title={`${table.name} · sample`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
