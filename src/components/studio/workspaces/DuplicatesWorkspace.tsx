import { motion } from "framer-motion";
import { Copy, Fingerprint, Trash2, Merge, AlertTriangle } from "lucide-react";
import { WorkspaceHeader, stagger } from "../Common";
import { StatCard } from "../StatCard";
import { SqlCard } from "../SqlCard";
import { DataTable } from "../DataTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DUP_GROUPS = [
  { key: "ava.rossi@example.com", count: 3, ids: [1042, 1188, 1349] },
  { key: "liam.chen@example.com", count: 2, ids: [1067, 1402] },
  { key: "noah.kim@example.com", count: 2, ids: [1099, 1451] },
  { key: "mia.silva@example.com", count: 2, ids: [1122, 1388] },
  { key: "marco.rossi@example.com", count: 4, ids: [1201, 1233, 1290, 1477] },
  { key: "elena.novak@example.com", count: 2, ids: [1310, 1499] },
];

const DUP_ROWS = DUP_GROUPS.flatMap((g) =>
  g.ids.map((id, i) => ({
    id,
    email: g.key,
    full_name: g.key.split("@")[0].split(".").map((s) => s[0].toUpperCase() + s.slice(1)).join(" "),
    is_duplicate: i > 0,
    created_at: `2024-${String((id % 12) + 1).padStart(2, "0")}-14`,
  })),
);

const FIX_SQL = `-- Keep earliest row per email, remove the rest
DELETE FROM auth.users a
USING auth.users b
WHERE a.id > b.id
  AND lower(a.email) = lower(b.email);

-- Prevent future duplicates
CREATE UNIQUE INDEX CONCURRENTLY users_email_lower_key
  ON auth.users (lower(email));`;

export function DuplicatesWorkspace() {
  const total = DUP_GROUPS.reduce((s, g) => s + g.count, 0);
  const removable = DUP_GROUPS.reduce((s, g) => s + g.count - 1, 0);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={Copy}
        title="Duplicate Analysis"
        subtitle="auth.users · matched on lower(email)"
        actions={<Badge variant="warning"><AlertTriangle className="h-3 w-3" />{DUP_GROUPS.length} groups</Badge>}
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={stagger.item}><StatCard icon={Fingerprint} label="Duplicate groups" value={`${DUP_GROUPS.length}`} tone="warning" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Copy} label="Affected rows" value={`${total}`} tone="info" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Trash2} label="Removable" value={`${removable}`} tone="destructive" /></motion.div>
        <motion.div variants={stagger.item}><StatCard icon={Merge} label="Data quality" value="97.4%" tone="success" /></motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {DUP_GROUPS.map((g, i) => (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/12 text-warning">
                  <span className="text-sm font-bold">{g.count}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs font-medium">{g.key}</div>
                  <div className="text-xs text-muted-foreground">ids: {g.ids.join(", ")}</div>
                </div>
                <Badge variant="destructive">{g.count - 1} dupes</Badge>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <SqlCard sql={FIX_SQL} title="Deduplication fix" />
          <Card className="p-0">
            <div className="p-4 pb-0">
              <p className="text-sm font-semibold">Highlighted duplicate rows</p>
              <p className="text-xs text-muted-foreground">Rows flagged <span className="text-destructive">is_duplicate = true</span> would be removed.</p>
            </div>
            <div className="p-4">
              <DataTable rows={DUP_ROWS} title="auth.users duplicates" pageSize={6} />
            </div>
          </Card>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast("Duplicates dismissed for this session")}>Dismiss</Button>
            <Button variant="gradient" onClick={() => toast.success(`Removed ${removable} duplicate rows`, { description: "Unique index created on lower(email)" })}>
              <Merge className="h-4 w-4" />Merge & fix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
