import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Charts";

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
  spark?: number[];
  tone?: "primary" | "success" | "warning" | "info" | "destructive";
  className?: string;
}

const TONES = {
  primary: { text: "text-primary", bg: "bg-primary/10", stroke: "hsl(var(--primary))" },
  success: { text: "text-success", bg: "bg-success/10", stroke: "hsl(var(--success))" },
  warning: { text: "text-warning", bg: "bg-warning/12", stroke: "hsl(var(--warning))" },
  info: { text: "text-info", bg: "bg-info/10", stroke: "hsl(var(--info))" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10", stroke: "hsl(var(--destructive))" },
};

export function StatCard({ icon: Icon, label, value, hint, trend, spark, tone = "primary", className }: StatCardProps) {
  const t = TONES[tone];
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", t.bg)}>
          <Icon className={cn("h-5 w-5", t.text)} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              trend.positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground/70">{hint}</div>}
      </div>
      {spark && (
        <div className="mt-3 -mb-1 opacity-70 transition-opacity group-hover:opacity-100">
          <Sparkline data={spark} stroke={t.stroke} />
        </div>
      )}
    </motion.div>
  );
}
