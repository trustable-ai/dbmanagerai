import { useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Copy,
  Database,
  MoreVertical,
  Plug,
  PlugZap,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  Star,
  Table2,
  Trash2,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { CONNECTIONS } from "@/lib/insights";
import type { Connection, ConnectionStatus } from "@/lib/types";
import { formatBytes, timeAgo } from "@/lib/format";
import { WorkspaceHeader, SectionTitle, KeyVal, stagger } from "../Common";
import { EnvBadge } from "../Badges";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NOW = new Date("2026-08-05T10:00:00Z");

const STATUS: Record<ConnectionStatus, { tone: string; label: string; pulse?: boolean }> = {
  connected: { tone: "bg-success", label: "Connected", pulse: true },
  idle: { tone: "bg-info", label: "Idle" },
  syncing: { tone: "bg-warning", label: "Syncing" },
  error: { tone: "bg-destructive", label: "Error" },
  disconnected: { tone: "bg-muted-foreground", label: "Disconnected" },
};

export function ConnectionsWorkspace() {
  const [conns, setConns] = useState<Connection[]>(CONNECTIONS);

  const toggleFav = (id: string) =>
    setConns((c) => c.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)));

  const sandbox = conns.find((c) => c.isSandbox)!;
  const external = conns.filter((c) => !c.isSandbox);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Plug}
        title="Connections"
        subtitle={`${conns.length} databases · ${conns.filter((c) => c.status === "connected").length} connected`}
        actions={
          <Button variant="gradient" onClick={() => toast("Add database dialog", { description: "Paste a connection string or fill the form." })}>
            <Plus className="h-4 w-4" />Add database
          </Button>
        }
      />

      {/* Sandbox control panel */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card to-card">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
              <Boxes className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{sandbox.name}</h2>
                <Badge variant="default"><Zap className="h-3 w-3" />Built-in</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Disposable ~200 MB demo database · always ready, no setup.</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Table2 className="h-3.5 w-3.5" />{sandbox.tableCount} tables</span>
                <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" />{sandbox.schemaCount} schemas</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{sandbox.activeConnections} connections</span>
                <span className="flex items-center gap-1"><Server className="h-3.5 w-3.5" />{formatBytes(sandbox.sizeBytes)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <SandboxBtn icon={RotateCcw} label="Reset" onClick={() => toast.success("Sandbox reset to seed data")} />
            <SandboxBtn icon={RefreshCw} label="Recreate" onClick={() => toast.success("Sandbox recreated")} />
            <SandboxBtn icon={Copy} label="Duplicate" onClick={() => toast.success("Sandbox duplicated")} />
            <SandboxBtn icon={Wand2} label="Restore demo" onClick={() => toast.success("Demo data restored")} />
            <SandboxBtn icon={Trash2} label="Delete" danger onClick={() => toast("Sandbox deleted", { description: "External databases are never affected." })} />
          </div>
        </div>
      </Card>

      {/* External connections */}
      <div>
        <SectionTitle hint={`${external.length} databases`}>Your databases</SectionTitle>
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {external.map((c) => {
            const st = STATUS[c.status];
            return (
              <motion.div key={c.id} variants={stagger.item} whileHover={{ y: -3 }}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                        <Database className="h-5 w-5 text-primary" />
                        <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card", st.tone, st.pulse && "animate-pulse")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold">{c.name}</h3>
                          {c.ssl && <Shield className="h-3.5 w-3.5 text-success" />}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{c.host}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => toggleFav(c.id)} className="rounded-md p-1.5 transition-colors hover:bg-muted">
                        <Star className={cn("h-4 w-4", c.favorite ? "fill-warning text-warning" : "text-muted-foreground")} />
                      </button>
                      <ConnMenu conn={c} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <EnvBadge env={c.environment} />
                    <Badge variant="secondary">v{c.version}</Badge>
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 border-t pt-3">
                    <KeyVal label="Size" value={formatBytes(c.sizeBytes)} />
                    <KeyVal label="Tables" value={c.tableCount} />
                    <KeyVal label="Schemas" value={c.schemaCount} />
                    <KeyVal label="Active" value={c.activeConnections} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.tone)} />{st.label}
                    </span>
                    <span className="text-xs text-muted-foreground">synced {timeAgo(c.lastSync, NOW)}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success(`Connected to ${c.name}`)}>
                      <PlugZap className="h-3.5 w-3.5" />Connect
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast(`Testing ${c.name}…`, { description: "Round-trip 42ms · OK" })}>
                      Test
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Add connection card */}
          <motion.button
            variants={stagger.item}
            onClick={() => toast("Add database dialog")}
            className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Add a PostgreSQL database</span>
            <span className="text-xs">Connection string or SSL form</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function SandboxBtn({ icon: Icon, label, onClick, danger }: { icon: typeof RotateCcw; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 text-xs font-medium transition-colors hover:bg-card",
        danger && "border-destructive/30 text-destructive hover:bg-destructive/10",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ConnMenu({ conn }: { conn: Connection }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-md p-1.5 transition-colors hover:bg-muted">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast(`Editing ${conn.name}`)}>Edit connection</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast(`Testing ${conn.name}…`)}>Test connection</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success(`Duplicated ${conn.name}`)}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast(`Disconnected ${conn.name}`)}>Disconnect</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast(`Deleted ${conn.name}`)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
