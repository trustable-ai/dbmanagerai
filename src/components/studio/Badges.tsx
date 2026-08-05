import { AlertOctagon, AlertTriangle, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Environment, Severity } from "@/lib/types";

const SEVERITY_MAP: Record<Severity, { variant: "destructive" | "warning" | "info" | "success"; label: string; Icon: typeof Info }> = {
  critical: { variant: "destructive", label: "Critical", Icon: AlertOctagon },
  high: { variant: "destructive", label: "High", Icon: ShieldAlert },
  medium: { variant: "warning", label: "Medium", Icon: AlertTriangle },
  low: { variant: "info", label: "Low", Icon: Info },
  info: { variant: "info", label: "Info", Icon: Info },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const { variant, label, Icon } = SEVERITY_MAP[severity];
  return (
    <Badge variant={variant} className={cn("px-2", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

const ENV_MAP: Record<Environment, { className: string; label: string }> = {
  production: { className: "bg-destructive/12 text-destructive", label: "Production" },
  staging: { className: "bg-warning/15 text-warning", label: "Staging" },
  development: { className: "bg-info/12 text-info", label: "Development" },
};

export function EnvBadge({ env, className }: { env: Environment; className?: string }) {
  const { className: c, label } = ENV_MAP[env];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ConfidencePill({ value }: { value: number }) {
  const tone = value >= 90 ? "text-success" : value >= 75 ? "text-info" : "text-warning";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <ShieldCheck className={cn("h-3.5 w-3.5", tone)} />
      <span className={tone}>{value}%</span> confidence
    </span>
  );
}
