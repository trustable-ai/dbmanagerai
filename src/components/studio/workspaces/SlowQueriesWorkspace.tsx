import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Database, Flame, Gauge, Repeat, Rocket, Timer } from "lucide-react";
import { SLOW_QUERIES } from "@/lib/insights";
import { series } from "@/lib/sandbox";
import { formatDuration, formatFullNumber, timeAgo } from "@/lib/format";
import { WorkspaceHeader, stagger } from "../Common";
import { StatCard } from "../StatCard";
import { Meter, Sparkline } from "../Charts";
import { SqlCard } from "../SqlCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOW = new Date("2026-08-05T10:00:00Z");

export function SlowQueriesWorkspace({ onRun }: { onRun: (cmd: string) => void }) {
  const sorted = [...SLOW_QUERIES].sort((a, b) => b.meanTimeMs - a.meanTimeMs);
  const [active, setActive] = useState(sorted[0].id);
  const current = sorted.find((s) => s.id === active)!;
  const maxMean = Math.max(...sorted.map((s) => s.meanTimeMs));
  const totalTime = sorted.reduce((s, q) => s + q.totalTimeMs, 0);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Flame}
        title="Performance Monitor"
        subtitle="pg_stat_statements · top offenders"
        actions={<Badge variant="warning"><Activity className="h-3 w-3" />{sorted.length} slow queries</Badge>}
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={stagger.item}><StatCard icon={Timer} label="Slowest mean" value={formatDuration(maxMean)} tone="destructive" spark={series(21, 24, 400, 1400)} /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Clock} label="Total time" value={`${(totalTime / 3600000).toFixed(1)}h`} tone="warning" spark={series(22, 24, 40, 90)} /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Repeat} label="Total calls" value={formatFullNumber(sorted.reduce((s, q) => s + q.calls, 0))} tone="info" spark={series(23, 24, 100, 900)} /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Gauge} label="Avg cache hit" value={`${Math.round(sorted.reduce((s, q) => s + q.cacheHitPercent, 0) / sorted.length)}%`} tone="success" spark={series(24, 24, 40, 99)} /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Query list */}
        <div className="space-y-2 lg:col-span-3">
          {sorted.map((q, i) => (
            <motion.button
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setActive(q.id)}
              className={cn(
                "w-full rounded-xl border bg-card p-3 text-left transition-all hover:shadow-soft",
                active === q.id && "border-primary/50 shadow-soft ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold", i === 0 ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground")}>
                  #{i + 1}
                </div>
                <code className="line-clamp-1 flex-1 font-mono text-xs text-muted-foreground">{q.query}</code>
                <span className="shrink-0 text-sm font-bold text-destructive tabular-nums">{formatDuration(q.meanTimeMs)}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 pl-11 text-xs text-muted-foreground">
                <span>{formatFullNumber(q.calls)} calls</span>
                <span className="flex items-center gap-1"><Database className="h-3 w-3" />{q.cacheHitPercent}% cache</span>
                <span className="ml-auto">{timeAgo(q.lastRun, NOW)}</span>
              </div>
              <div className="mt-2 pl-11">
                <Meter value={(q.meanTimeMs / maxMean) * 100} tone={i === 0 ? "hsl(var(--destructive))" : "hsl(var(--warning))"} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="sticky top-4">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Query detail</span>
                <Badge variant="destructive">{formatDuration(current.meanTimeMs)} mean</Badge>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <SqlCard sql={current.query.replace(/ (FROM|WHERE|JOIN|GROUP|ORDER|AND) /g, "\n$1 ")} title="Statement" editable={false} compact onExecute={() => {}} />
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Calls" value={formatFullNumber(current.calls)} />
                <Metric label="Total time" value={`${(current.totalTimeMs / 60000).toFixed(1)} min`} />
                <Metric label="Rows" value={formatFullNumber(current.rows)} />
                <Metric label="Cache hit" value={`${current.cacheHitPercent}%`} />
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Latency trend (24h)</span>
                  <span className="text-destructive">▲ trending up</span>
                </div>
                <Sparkline data={series(current.id.charCodeAt(2) + 40, 30, 200, current.meanTimeMs)} stroke="hsl(var(--destructive))" className="h-16" />
              </div>
              <Button variant="gradient" className="w-full" onClick={() => onRun("Optimize my slowest query")}>
                <Rocket className="h-4 w-4" />Optimize this query
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
