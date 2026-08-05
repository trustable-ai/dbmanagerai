import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  HardDrive,
  Lightbulb,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { INSIGHTS } from "@/lib/insights";
import type { Insight, Severity } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { WorkspaceHeader, stagger } from "../Common";
import { SeverityBadge, ConfidencePill } from "../Badges";
import { SqlCard } from "../SqlCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NOW = new Date("2026-08-05T10:00:00Z");
const SEV_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function InsightsWorkspace() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");

  const visible = useMemo(
    () =>
      INSIGHTS.filter((i) => !dismissed.has(i.id) && (filter === "all" || i.severity === filter)).sort(
        (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
      ),
    [dismissed, filter],
  );

  const open = INSIGHTS.find((i) => i.id === openId) ?? null;
  const counts = (sev: Severity) => INSIGHTS.filter((i) => i.severity === sev && !dismissed.has(i.id)).length;

  const dismiss = (id: string) => {
    setDismissed((s) => new Set(s).add(id));
    setOpenId(null);
    toast("Insight dismissed");
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Sparkles}
        title="AI Insights"
        subtitle="Continuous analysis of your database"
        actions={<Badge variant="default"><Lightbulb className="h-3 w-3" />{visible.length} active</Badge>}
      />

      {/* Severity summary chips */}
      <div className="flex flex-wrap gap-2">
        <SummaryChip label="All" count={INSIGHTS.length - dismissed.size} active={filter === "all"} onClick={() => setFilter("all")} tone="text-foreground" />
        <SummaryChip label="Critical" count={counts("critical")} active={filter === "critical"} onClick={() => setFilter("critical")} tone="text-destructive" />
        <SummaryChip label="High" count={counts("high")} active={filter === "high"} onClick={() => setFilter("high")} tone="text-destructive" />
        <SummaryChip label="Medium" count={counts("medium")} active={filter === "medium"} onClick={() => setFilter("medium")} tone="text-warning" />
        <SummaryChip label="Low / Info" count={counts("low") + counts("info")} active={filter === "low"} onClick={() => setFilter("low")} tone="text-info" />
      </div>

      <motion.div variants={stagger.container} initial="hidden" animate="show" key={filter} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((ins) => (
          <motion.button
            key={ins.id}
            variants={stagger.item}
            whileHover={{ y: -4 }}
            onClick={() => setOpenId(ins.id)}
            className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-elegant"
          >
            <div className={cn("absolute left-0 top-0 h-full w-1", ins.severity === "critical" || ins.severity === "high" ? "bg-destructive" : ins.severity === "medium" ? "bg-warning" : "bg-info")} />
            <div className="flex items-center justify-between">
              <SeverityBadge severity={ins.severity} />
              <span className="text-xs text-muted-foreground">{timeAgo(ins.generatedAt, NOW)}</span>
            </div>
            <h3 className="mt-3 font-semibold leading-snug">{ins.title}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{ins.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{ins.category}</Badge>
              {ins.affectedObjects.slice(0, 1).map((o) => (
                <span key={o} className="truncate font-mono text-xs text-muted-foreground">{o}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <ConfidencePill value={ins.confidence} />
              <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Details <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          {open && (
            <>
              <SheetTitle className="sr-only">{open.title}</SheetTitle>
              <SheetDescription className="sr-only">{open.description}</SheetDescription>
              <InsightDetail insight={open} onDismiss={() => dismiss(open.id)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SummaryChip({ label, count, active, onClick, tone }: { label: string; count: number; active: boolean; onClick: () => void; tone: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", active ? "border-primary bg-primary/10" : "hover:bg-muted")}
    >
      <span>{label}</span>
      <span className={cn("rounded-full bg-muted px-1.5 text-xs tabular-nums", tone)}>{count}</span>
    </button>
  );
}

function InsightDetail({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-gradient-to-br from-primary/5 to-card p-5">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={insight.severity} />
          <Badge variant="secondary">{insight.category}</Badge>
        </div>
        <h2 className="mt-3 pr-8 text-lg font-bold leading-snug">{insight.title}</h2>
        <div className="mt-2 flex items-center gap-3">
          <ConfidencePill value={insight.confidence} />
          <span className="text-xs text-muted-foreground">{timeAgo(insight.generatedAt, NOW)}</span>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <p className="text-sm text-muted-foreground">{insight.detail}</p>

        <div className="grid grid-cols-2 gap-3">
          <ImpactCard icon={TrendingUp} label="Performance" value={insight.perfImpact} tone="text-success" />
          <ImpactCard icon={HardDrive} label="Storage" value={insight.storageImpact} tone="text-info" />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affected objects</p>
          <div className="flex flex-wrap gap-1.5">
            {insight.affectedObjects.map((o) => (
              <span key={o} className="flex items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1 font-mono text-xs">
                <Database className="h-3 w-3 text-muted-foreground" />{o}
              </span>
            ))}
          </div>
        </div>

        {/* Before / after */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before / after</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive"><span className="h-2 w-2 rounded-full bg-destructive" />Before</div>
              {insight.before.map((b) => (
                <div key={b.label} className="flex justify-between py-0.5 text-xs"><span className="text-muted-foreground">{b.label}</span><span className="font-medium">{b.value}</span></div>
              ))}
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-2 w-2 rounded-full bg-success" />After</div>
              {insight.after.map((b) => (
                <div key={b.label} className="flex justify-between py-0.5 text-xs"><span className="text-muted-foreground">{b.label}</span><span className="font-medium">{b.value}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="text-sm font-medium text-success">{insight.estimatedImprovement}</span>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated fix</p>
          <SqlCard sql={insight.sqlFix} title="Recommended SQL" compact />
        </div>

        <a href={insight.docsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <BookOpen className="h-4 w-4" />Related documentation
        </a>
      </div>

      <div className="flex items-center gap-2 border-t bg-card p-4">
        <Button variant="outline" className="flex-1" onClick={onDismiss}><X className="h-4 w-4" />Dismiss</Button>
        <Button variant="outline" className="flex-1" onClick={() => toast.success("Recommendation saved")}>Save</Button>
        <Button variant="gradient" className="flex-1" onClick={() => toast.success("Fix executed", { description: insight.estimatedImprovement })}>
          <CheckCircle2 className="h-4 w-4" />Execute
        </Button>
      </div>
    </div>
  );
}

function ImpactCard({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className={cn("mt-1 text-sm font-bold", tone)}>{value}</div>
    </div>
  );
}
