import { motion } from "framer-motion";
import {
  Activity,
  Database,
  GaugeCircle,
  HardDrive,
  Layers,
  Lock,
  Network,
  Plug,
  Table2,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { DB_OVERVIEW, SCHEMAS, series } from "@/lib/sandbox";
import { ACTIVITY, INSIGHTS } from "@/lib/insights";
import { formatBytes, formatFullNumber, timeAgo } from "@/lib/format";
import { StatCard } from "../StatCard";
import { HealthRing, Meter, Sparkline } from "../Charts";
import { WorkspaceHeader, SectionTitle, KeyVal, stagger } from "../Common";
import { SeverityBadge } from "../Badges";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NOW = new Date("2026-08-05T10:00:00Z");

export function OverviewWorkspace({ onRun }: { onRun: (cmd: string) => void }) {
  const o = DB_OVERVIEW;
  const storagePct = (o.storageBytes / o.storageCapacityBytes) * 100;
  const connPct = (o.activeConnections / o.maxConnections) * 100;

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={GaugeCircle}
        title="Database Overview"
        subtitle="Sandbox DB · PostgreSQL 16.3 · healthy"
        actions={<Badge variant="success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />Live</Badge>}
      />

      {/* Hero row: health ring + key gauges */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card lg:col-span-1">
          <div className="flex items-center gap-5 p-5">
            <HealthRing value={o.healthScore} sublabel="score" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Database Health</p>
              <p className="text-xs text-muted-foreground">Composite of cache, locks, bloat & replication.</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="success">Replication OK</Badge>
                <Badge variant="warning">{o.slowQueryCount} slow</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <Gauge label="Cache Hit" value={`${o.cacheHitRatio}%`} pct={o.cacheHitRatio} tone="hsl(var(--success))" />
            <Gauge label="Connections" value={`${o.activeConnections}/${o.maxConnections}`} pct={connPct} tone="hsl(var(--info))" />
            <Gauge label="Storage" value={formatBytes(o.storageBytes)} pct={storagePct} tone="hsl(var(--primary))" />
            <Gauge label="Locks" value={`${o.locks}`} pct={o.locks * 8} tone="hsl(var(--warning))" />
          </div>
        </Card>
      </div>

      {/* Stat cards grid */}
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          <StatCard key="1" icon={Zap} label="Transactions / s" value={formatFullNumber(o.transactionsPerSec)} tone="primary" trend={{ value: "8%", direction: "up", positive: true }} spark={series(1, 24, 900, 1500)} />,
          <StatCard key="2" icon={Table2} label="Tables" value={`${o.tableCount}`} tone="info" hint={`${o.schemaCount} schemas`} spark={series(2, 24, 12, 16)} />,
          <StatCard key="3" icon={Layers} label="Schemas" value={`${o.schemaCount}`} tone="info" spark={series(3, 24, 3, 6)} />,
          <StatCard key="4" icon={HardDrive} label="Storage" value={formatBytes(o.storageBytes)} tone="primary" trend={{ value: "12%", direction: "up", positive: false }} spark={series(4, 24, 380, 460)} />,
          <StatCard key="5" icon={Timer} label="Slow queries" value={`${o.slowQueryCount}`} tone="warning" spark={series(5, 24, 3, 12)} />,
          <StatCard key="6" icon={Network} label="Repl. lag" value={`${o.replicationLagMs}ms`} tone="success" spark={series(6, 24, 20, 90)} />,
        ].map((c, i) => (
          <motion.div key={i} variants={stagger.item}>{c}</motion.div>
        ))}
      </motion.div>

      {/* Bottom: throughput chart + insights + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Transaction throughput</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />commits</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />rollbacks</span>
            </div>
          </div>
          <div className="space-y-3 px-5 pb-5">
            <div className="rounded-lg bg-muted/30 p-3">
              <Sparkline data={series(11, 40, 800, 1500)} stroke="hsl(var(--success))" className="h-24" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Commits/s" value={formatFullNumber(o.commitsPerSec)} tone="text-success" />
              <MiniStat label="Rollbacks/s" value={`${o.rollbacksPerSec}`} tone="text-destructive" />
              <MiniStat label="Uptime" value={o.uptime} tone="text-foreground" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm font-semibold">Top insights</span>
            </div>
            <button onClick={() => onRun("Show AI insights")} className="text-xs font-medium text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-1 px-3 pb-3">
            {INSIGHTS.slice(0, 4).map((ins) => (
              <button
                key={ins.id}
                onClick={() => onRun("Show AI insights")}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <SeverityBadge severity={ins.severity} className="shrink-0" />
                <span className="line-clamp-1 flex-1 text-sm">{ins.title}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="p-5">
            <SectionTitle hint="last 24h">Recent activity</SectionTitle>
            <div className="relative space-y-4 pl-2">
              <div className="absolute bottom-2 left-[9px] top-2 w-px bg-border" />
              {ACTIVITY.slice(0, 5).map((a) => (
                <div key={a.id} className="relative flex gap-3">
                  <span className="relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-card" />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(a.at, NOW)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <SectionTitle>Schemas</SectionTitle>
            <div className="space-y-3">
              {SCHEMAS.map((s, i) => (
                <div key={s.name}>
                  <KeyVal label={<span className="font-mono">{s.name}</span>} value={`${s.tableCount} tables`} />
                  <Meter value={(s.tableCount / 6) * 100} tone={`hsl(${210 + i * 20} 70% 55%)`} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Gauge({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <Meter value={pct} tone={tone} />
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
