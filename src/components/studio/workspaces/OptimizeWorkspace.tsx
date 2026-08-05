import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Gauge, Rocket, Timer, TrendingDown, Zap } from "lucide-react";
import { WorkspaceHeader, stagger } from "../Common";
import { HealthRing, Meter } from "../Charts";
import { SqlCard } from "../SqlCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BEFORE_SQL = `SELECT o.*, u.full_name
FROM commerce.orders o
JOIN auth.users u ON u.id = o.user_id
WHERE o.status = 'pending'
ORDER BY o.placed_at DESC;`;

const AFTER_SQL = `-- Add covering index, then the same query
CREATE INDEX CONCURRENTLY idx_orders_status_placed
  ON commerce.orders (status, placed_at DESC)
  INCLUDE (user_id, total);

SELECT o.*, u.full_name
FROM commerce.orders o
JOIN auth.users u ON u.id = o.user_id
WHERE o.status = 'pending'
ORDER BY o.placed_at DESC;`;

const PLAN = [
  { node: "Sort", before: "cost 18420", after: "cost 240", improved: true },
  { node: "Hash Join", before: "cost 12100", after: "cost 190", improved: true },
  { node: "Seq Scan orders", before: "184,920 rows", after: "Index Scan · 1,240 rows", improved: true },
  { node: "Index Scan users", before: "cost 8.3", after: "cost 8.3", improved: false },
];

const RECS = [
  { title: "Add composite index on (status, placed_at)", impact: "High", tone: "success" as const },
  { title: "Use INCLUDE columns to enable index-only scan", impact: "High", tone: "success" as const },
  { title: "Avoid SELECT * — project only needed columns", impact: "Medium", tone: "info" as const },
  { title: "Consider partial index WHERE status = 'pending'", impact: "Medium", tone: "info" as const },
];

export function OptimizeWorkspace() {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Rocket}
        title="Query Optimization"
        subtitle="commerce.orders · pending orders feed"
        actions={<Badge variant="success"><TrendingDown className="h-3 w-3" />72% faster</Badge>}
      />

      {/* Score + headline metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 bg-gradient-to-br from-success/5 to-card p-5">
          <HealthRing value={92} sublabel="score" tone="hsl(var(--success))" />
          <div>
            <p className="text-sm font-semibold">Optimization score</p>
            <p className="text-xs text-muted-foreground">Up from 41 before changes.</p>
            <Badge variant="success" className="mt-2"><CheckCircle2 className="h-3 w-3" />Recommended</Badge>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <BeforeAfter icon={Timer} label="Mean latency" before="842 ms" after="236 ms" pct={72} />
            <BeforeAfter icon={Zap} label="Rows read" before="184,920" after="1,240" pct={99} />
            <BeforeAfter icon={Gauge} label="Buffer hits" before="71%" after="99%" pct={39} />
          </div>
        </Card>
      </div>

      {/* Before / after SQL */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-destructive" />Before</div>
          <SqlCard sql={BEFORE_SQL} title="Original query" editable={false} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-success" />After</div>
          <SqlCard sql={AFTER_SQL} title="Optimized query" />
        </div>
      </div>

      {/* Plan comparison + recommendations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-5">
            <p className="mb-3 text-sm font-semibold">Execution plan diff</p>
            <div className="space-y-2">
              {PLAN.map((p, i) => (
                <motion.div
                  key={p.node}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-xs", p.improved ? "border-success/30 bg-success/5" : "bg-muted/20")}
                >
                  <span className="w-32 shrink-0 font-mono font-medium">{p.node}</span>
                  <span className="text-muted-foreground line-through">{p.before}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className={cn("font-medium", p.improved ? "text-success" : "text-muted-foreground")}>{p.after}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <p className="mb-3 text-sm font-semibold">Recommendations</p>
            <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-2">
              {RECS.map((r) => (
                <motion.div key={r.title} variants={stagger.item} className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckCircle2 className={cn("h-4 w-4 shrink-0", r.tone === "success" ? "text-success" : "text-info")} />
                  <span className="flex-1 text-sm">{r.title}</span>
                  <Badge variant={r.tone}>{r.impact}</Badge>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function BeforeAfter({ icon: Icon, label, before, after, pct }: { icon: typeof Timer; label: string; before: string; after: string; pct: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground line-through">{before}</span>
        <span className="text-lg font-bold text-success tabular-nums">{after}</span>
      </div>
      <Meter value={pct} tone="hsl(var(--success))" />
    </div>
  );
}
