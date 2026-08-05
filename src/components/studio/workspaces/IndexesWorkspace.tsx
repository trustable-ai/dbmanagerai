import { useState } from "react";
import { motion } from "framer-motion";
import { Database, KeyRound, Layers, Search, Trash2, TrendingUp, Zap } from "lucide-react";
import { ALL_INDEXES } from "@/lib/sandbox";
import type { IndexInfo } from "@/lib/types";
import { formatBytes, formatFullNumber } from "@/lib/format";
import { WorkspaceHeader, stagger } from "../Common";
import { StatCard } from "../StatCard";
import { Meter } from "../Charts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const USAGE_TONE: Record<IndexInfo["usage"], { badge: "success" | "info" | "warning" | "secondary"; bar: string }> = {
  high: { badge: "success", bar: "hsl(var(--success))" },
  moderate: { badge: "info", bar: "hsl(var(--info))" },
  low: { badge: "warning", bar: "hsl(var(--warning))" },
  unused: { badge: "warning", bar: "hsl(var(--destructive))" },
};

export function IndexesWorkspace() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<IndexInfo["usage"] | "all">("all");

  const indexes = ALL_INDEXES.filter(
    (i) => (filter === "all" || i.usage === filter) && (i.name.includes(q.toLowerCase()) || i.table.includes(q.toLowerCase())),
  ).sort((a, b) => b.scans - a.scans);

  const totalSize = ALL_INDEXES.reduce((s, i) => s + i.sizeBytes, 0);
  const unused = ALL_INDEXES.filter((i) => i.usage === "unused");
  const totalScans = ALL_INDEXES.reduce((s, i) => s + i.scans, 0);
  const maxScans = Math.max(...ALL_INDEXES.map((i) => i.scans));

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={KeyRound}
        title="Index Dashboard"
        subtitle={`${ALL_INDEXES.length} indexes · ${formatBytes(totalSize)} total`}
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search indexes…" className="h-9 w-full pl-9 sm:w-56" />
          </div>
        }
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={stagger.item}><StatCard icon={KeyRound} label="Total indexes" value={`${ALL_INDEXES.length}`} tone="primary" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Layers} label="Index size" value={formatBytes(totalSize)} tone="info" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Zap} label="Total scans" value={formatFullNumber(totalScans)} tone="success" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Trash2} label="Unused" value={`${unused.length}`} hint={formatBytes(unused.reduce((s, i) => s + i.sizeBytes, 0))} tone="warning" /></motion.div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {(["all", "high", "moderate", "low", "unused"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors", filter === f ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
          >
            {f}
          </button>
        ))}
      </div>

      <motion.div variants={stagger.container} initial="hidden" animate="show" key={filter} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {indexes.map((idx) => {
          const tone = USAGE_TONE[idx.usage];
          return (
            <motion.div key={idx.name} variants={stagger.item} whileHover={{ y: -3 }}>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm font-semibold">{idx.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{idx.table} · {idx.type}</div>
                  </div>
                  <Badge variant={tone.badge} className="shrink-0 capitalize">{idx.usage}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {idx.columns.map((c) => (
                    <span key={c} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{c}</span>
                  ))}
                  {idx.unique && <Badge variant="info" className="px-1.5">unique</Badge>}
                  {idx.isPrimary && <Badge variant="secondary" className="px-1.5"><KeyRound className="h-3 w-3" />PK</Badge>}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatFullNumber(idx.scans)} scans</span>
                    <span className="font-medium">{formatBytes(idx.sizeBytes)}</span>
                  </div>
                  <Meter value={Math.min(100, (idx.scans / maxScans) * 100)} tone={tone.bar} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
