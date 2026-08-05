import type { ActivityEvent, Connection, Insight, SlowQuery } from "./types";

const NOW = "2026-08-05T10:00:00Z";
function ago(mins: number): string {
  return new Date(new Date(NOW).getTime() - mins * 60000).toISOString();
}

export const SLOW_QUERIES: SlowQuery[] = [
  {
    id: "sq1",
    query:
      "SELECT o.*, u.full_name FROM commerce.orders o JOIN auth.users u ON u.id = o.user_id WHERE o.status = 'pending' ORDER BY o.placed_at DESC",
    meanTimeMs: 842.4, calls: 18240, totalTimeMs: 15365000, rows: 1240, cacheHitPercent: 71.2, lastRun: ago(2),
  },
  {
    id: "sq2",
    query:
      "SELECT COUNT(*) FROM analytics.events WHERE properties @> '{\"plan\":\"pro\"}' AND occurred_at > now() - interval '7 days'",
    meanTimeMs: 1310.7, calls: 4200, totalTimeMs: 5505000, rows: 1, cacheHitPercent: 44.0, lastRun: ago(6),
  },
  {
    id: "sq3",
    query:
      "SELECT p.name, SUM(oi.quantity) FROM commerce.order_items oi JOIN commerce.products p ON p.id = oi.product_id GROUP BY p.name ORDER BY 2 DESC LIMIT 20",
    meanTimeMs: 638.9, calls: 9600, totalTimeMs: 6133000, rows: 20, cacheHitPercent: 82.5, lastRun: ago(11),
  },
  {
    id: "sq4",
    query: "SELECT * FROM auth.sessions WHERE expires_at < now()",
    meanTimeMs: 512.3, calls: 30400, totalTimeMs: 15573000, rows: 84200, cacheHitPercent: 58.0, lastRun: ago(1),
  },
  {
    id: "sq5",
    query: "UPDATE analytics.notifications SET read = true WHERE user_id = $1 AND read = false",
    meanTimeMs: 402.1, calls: 51200, totalTimeMs: 20587000, rows: 12, cacheHitPercent: 63.4, lastRun: ago(4),
  },
  {
    id: "sq6",
    query: "SELECT * FROM audit.audit_logs WHERE entity = $1 ORDER BY created_at DESC LIMIT 50",
    meanTimeMs: 288.6, calls: 22100, totalTimeMs: 6378000, rows: 50, cacheHitPercent: 88.9, lastRun: ago(9),
  },
  {
    id: "sq7",
    query: "SELECT DISTINCT email FROM auth.users WHERE lower(email) LIKE '%@example.com'",
    meanTimeMs: 254.0, calls: 1400, totalTimeMs: 355600, rows: 48210, cacheHitPercent: 51.0, lastRun: ago(20),
  },
];

export const INSIGHTS: Insight[] = [
  {
    id: "ins-missing-idx-orders",
    severity: "high",
    category: "Missing Index",
    title: "Missing index on orders.status",
    description: "Frequent filters on orders.status trigger sequential scans over 184K rows.",
    confidence: 94,
    affectedObjects: ["commerce.orders"],
    perfImpact: "-72% query time",
    storageImpact: "+6 MB",
    generatedAt: ago(3),
    detail:
      "The query planner falls back to a sequential scan when filtering commerce.orders by status because no matching index exists. This dominates the cost of your busiest endpoint.",
    sqlFix:
      "CREATE INDEX CONCURRENTLY idx_orders_status_placed\n  ON commerce.orders (status, placed_at DESC);",
    estimatedImprovement: "842ms → 236ms mean latency",
    before: [
      { label: "Scan type", value: "Seq Scan" },
      { label: "Mean time", value: "842 ms" },
      { label: "Rows read", value: "184,920" },
    ],
    after: [
      { label: "Scan type", value: "Index Scan" },
      { label: "Mean time", value: "236 ms" },
      { label: "Rows read", value: "1,240" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/indexes.html",
  },
  {
    id: "ins-unused-idx",
    severity: "medium",
    category: "Unused Index",
    title: "Large unused index on users.created_at",
    description: "idx_users_created_at has 0 scans in 30 days but consumes 5.4 MB.",
    confidence: 88,
    affectedObjects: ["auth.users → idx_users_created_at"],
    perfImpact: "Faster writes",
    storageImpact: "-5.4 MB",
    generatedAt: ago(18),
    detail:
      "This index has never been used by the planner in the observed window. It adds overhead to every INSERT/UPDATE on auth.users without benefiting reads.",
    sqlFix: "DROP INDEX CONCURRENTLY auth.idx_users_created_at;",
    estimatedImprovement: "+8% write throughput on auth.users",
    before: [
      { label: "Index size", value: "5.4 MB" },
      { label: "Scans (30d)", value: "0" },
      { label: "Write overhead", value: "High" },
    ],
    after: [
      { label: "Index size", value: "0 MB" },
      { label: "Scans (30d)", value: "—" },
      { label: "Write overhead", value: "None" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/monitoring-stats.html",
  },
  {
    id: "ins-no-pk",
    severity: "critical",
    category: "Missing Primary Key",
    title: "Table analytics.notifications has no primary key",
    description: "421K-row table lacks a primary key, blocking logical replication and safe upserts.",
    confidence: 99,
    affectedObjects: ["analytics.notifications"],
    perfImpact: "Replication safe",
    storageImpact: "+9 MB",
    generatedAt: ago(40),
    detail:
      "Tables without a primary key cannot be replicated logically and are prone to duplicate rows. Add a surrogate key to restore integrity guarantees.",
    sqlFix:
      "ALTER TABLE analytics.notifications\n  ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;",
    estimatedImprovement: "Enables logical replication + safe upserts",
    before: [
      { label: "Primary key", value: "None" },
      { label: "Replication", value: "Blocked" },
      { label: "Duplicate risk", value: "High" },
    ],
    after: [
      { label: "Primary key", value: "id (identity)" },
      { label: "Replication", value: "Enabled" },
      { label: "Duplicate risk", value: "None" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html",
  },
  {
    id: "ins-bloat",
    severity: "high",
    category: "Table Bloat",
    title: "High bloat on auth.sessions (22%)",
    description: "Dead tuples from high session churn inflate storage and slow scans.",
    confidence: 90,
    affectedObjects: ["auth.sessions"],
    perfImpact: "-18% scan time",
    storageImpact: "-6.2 MB",
    generatedAt: ago(55),
    detail:
      "auth.sessions has accumulated dead tuples due to frequent inserts/deletes. A VACUUM FULL (or pg_repack) reclaims space and improves scan performance.",
    sqlFix: "VACUUM (ANALYZE, VERBOSE) auth.sessions;",
    estimatedImprovement: "Reclaims 6.2 MB, refreshes planner stats",
    before: [
      { label: "Bloat", value: "22%" },
      { label: "Dead tuples", value: "46,300" },
      { label: "Last vacuum", value: "9 days ago" },
    ],
    after: [
      { label: "Bloat", value: "3%" },
      { label: "Dead tuples", value: "~0" },
      { label: "Last vacuum", value: "just now" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/routine-vacuuming.html",
  },
  {
    id: "ins-duplicates",
    severity: "medium",
    category: "Duplicate Records",
    title: "Duplicate emails detected in auth.users",
    description: "18 rows share an email under differing casing, bypassing the unique index.",
    confidence: 82,
    affectedObjects: ["auth.users"],
    perfImpact: "Data quality",
    storageImpact: "negligible",
    generatedAt: ago(72),
    detail:
      "The unique constraint on email is case-sensitive. Rows like Ava.Rossi@… and ava.rossi@… coexist. Normalize casing and add a functional unique index.",
    sqlFix:
      "CREATE UNIQUE INDEX CONCURRENTLY users_email_lower_key\n  ON auth.users (lower(email));",
    estimatedImprovement: "Prevents 18 duplicate identities",
    before: [
      { label: "Duplicate groups", value: "18" },
      { label: "Constraint", value: "case-sensitive" },
      { label: "Data quality", value: "At risk" },
    ],
    after: [
      { label: "Duplicate groups", value: "0" },
      { label: "Constraint", value: "case-insensitive" },
      { label: "Data quality", value: "Clean" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/indexes-expressional.html",
  },
  {
    id: "ins-missing-fk",
    severity: "low",
    category: "Missing Foreign Key",
    title: "analytics.events.user_id lacks a foreign key",
    description: "Orphaned events reference deleted users with no referential guard.",
    confidence: 76,
    affectedObjects: ["analytics.events"],
    perfImpact: "Integrity",
    storageImpact: "none",
    generatedAt: ago(120),
    detail:
      "events.user_id is not constrained, allowing orphaned analytics rows. Consider a NOT VALID foreign key to avoid a long lock while validating existing data.",
    sqlFix:
      "ALTER TABLE analytics.events\n  ADD CONSTRAINT fk_events_user FOREIGN KEY (user_id)\n  REFERENCES auth.users(id) NOT VALID;",
    estimatedImprovement: "Restores referential integrity",
    before: [
      { label: "FK constraint", value: "None" },
      { label: "Orphan rows", value: "~2,400" },
      { label: "Integrity", value: "Weak" },
    ],
    after: [
      { label: "FK constraint", value: "fk_events_user" },
      { label: "Orphan rows", value: "guarded" },
      { label: "Integrity", value: "Enforced" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/ddl-constraints.html",
  },
  {
    id: "ins-longtx",
    severity: "high",
    category: "Long-running Transaction",
    title: "Long-running transaction holding locks",
    description: "A transaction open for 14 min blocks autovacuum on commerce.orders.",
    confidence: 85,
    affectedObjects: ["commerce.orders", "pid 48213"],
    perfImpact: "Unblocks vacuum",
    storageImpact: "prevents bloat",
    generatedAt: ago(9),
    detail:
      "An idle-in-transaction session is holding an old snapshot, preventing autovacuum from cleaning dead tuples across hot tables.",
    sqlFix: "SELECT pg_terminate_backend(48213);",
    estimatedImprovement: "Restores autovacuum progress",
    before: [
      { label: "Tx age", value: "14 min" },
      { label: "State", value: "idle in tx" },
      { label: "Blocked vacuum", value: "Yes" },
    ],
    after: [
      { label: "Tx age", value: "—" },
      { label: "State", value: "terminated" },
      { label: "Blocked vacuum", value: "No" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/monitoring-stats.html",
  },
  {
    id: "ins-backup",
    severity: "info",
    category: "Backup Reminder",
    title: "Last base backup was 6 days ago",
    description: "Recovery point objective drifting beyond the 24h target.",
    confidence: 100,
    affectedObjects: ["cluster"],
    perfImpact: "none",
    storageImpact: "+180 MB",
    generatedAt: ago(200),
    detail:
      "Your most recent physical base backup is 6 days old. Schedule a fresh backup to keep the recovery window within policy.",
    sqlFix: "-- Run from shell:\npg_basebackup -D /backups/$(date +%F) -Ft -z -P",
    estimatedImprovement: "RPO 6d → 24h",
    before: [
      { label: "Last backup", value: "6 days ago" },
      { label: "RPO", value: "144h" },
      { label: "Policy", value: "Breached" },
    ],
    after: [
      { label: "Last backup", value: "just now" },
      { label: "RPO", value: "24h" },
      { label: "Policy", value: "Met" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/app-pgbasebackup.html",
  },
  {
    id: "ins-security",
    severity: "critical",
    category: "Security",
    title: "Public role has write access to audit.audit_logs",
    description: "The audit trail should be append-only; PUBLIC currently holds UPDATE/DELETE.",
    confidence: 91,
    affectedObjects: ["audit.audit_logs"],
    perfImpact: "none",
    storageImpact: "none",
    generatedAt: ago(30),
    detail:
      "Granting write access to PUBLIC on an audit table undermines its integrity. Revoke mutating privileges and keep only INSERT.",
    sqlFix:
      "REVOKE UPDATE, DELETE ON audit.audit_logs FROM PUBLIC;\nGRANT INSERT ON audit.audit_logs TO app_writer;",
    estimatedImprovement: "Immutable audit trail restored",
    before: [
      { label: "PUBLIC grants", value: "SELECT/UPDATE/DELETE" },
      { label: "Immutable", value: "No" },
      { label: "Risk", value: "Critical" },
    ],
    after: [
      { label: "PUBLIC grants", value: "SELECT only" },
      { label: "Immutable", value: "Yes" },
      { label: "Risk", value: "Low" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/sql-grant.html",
  },
  {
    id: "ins-growth",
    severity: "info",
    category: "Growth Trend",
    title: "Database grew 12% this month",
    description: "analytics.events drives most growth at +1.8M rows/30d.",
    confidence: 97,
    affectedObjects: ["analytics.events"],
    perfImpact: "capacity",
    storageImpact: "+58 MB/mo",
    generatedAt: ago(300),
    detail:
      "At the current trajectory storage reaches 80% capacity in ~5 months. Consider partitioning analytics.events by month and archiving cold partitions.",
    sqlFix:
      "-- Partition strategy\nCREATE TABLE analytics.events_2026_08 PARTITION OF analytics.events\n  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');",
    estimatedImprovement: "Bounds hot set, enables cheap archival",
    before: [
      { label: "Monthly growth", value: "+58 MB" },
      { label: "Partitioned", value: "No" },
      { label: "Time to 80%", value: "~5 mo" },
    ],
    after: [
      { label: "Monthly growth", value: "managed" },
      { label: "Partitioned", value: "Yes (monthly)" },
      { label: "Time to 80%", value: "deferred" },
    ],
    docsUrl: "https://www.postgresql.org/docs/current/ddl-partitioning.html",
  },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", type: "query", title: "Executed query", detail: "SELECT on commerce.orders • 236ms", at: ago(1) },
  { id: "a2", type: "insight", title: "New insight generated", detail: "Missing index on orders.status", at: ago(3) },
  { id: "a3", type: "vacuum", title: "Autovacuum completed", detail: "auth.sessions • reclaimed 6.2 MB", at: ago(12) },
  { id: "a4", type: "index", title: "Index created", detail: "idx_products_category on commerce.products", at: ago(48) },
  { id: "a5", type: "connection", title: "Sandbox synchronized", detail: "15 tables • 5 schemas", at: ago(63) },
  { id: "a6", type: "backup", title: "Backup reminder", detail: "Last base backup 6 days ago", at: ago(200) },
  { id: "a7", type: "query", title: "Executed query", detail: "GROUP BY on order_items • 638ms", at: ago(240) },
];

export const CONNECTIONS: Connection[] = [
  {
    id: "sandbox", name: "Sandbox DB", host: "sandbox.local:5432", version: "16.3", sizeBytes: 200 * 1024 * 1024,
    schemaCount: 5, tableCount: 15, activeConnections: 34, lastSync: ago(63), status: "connected",
    favorite: true, tags: ["demo", "seeded"], environment: "development", ssl: false, isSandbox: true,
  },
  {
    id: "prod", name: "acme-prod", host: "db.acme.io:5432", version: "16.1", sizeBytes: 84 * 1024 * 1024 * 1024,
    schemaCount: 11, tableCount: 142, activeConnections: 212, lastSync: ago(4), status: "connected",
    favorite: true, tags: ["core", "eu-west"], environment: "production", ssl: true,
  },
  {
    id: "staging", name: "acme-staging", host: "db.staging.acme.io:5432", version: "16.1", sizeBytes: 22 * 1024 * 1024 * 1024,
    schemaCount: 11, tableCount: 138, activeConnections: 18, lastSync: ago(26), status: "syncing",
    favorite: false, tags: ["core"], environment: "staging", ssl: true,
  },
  {
    id: "analytics", name: "analytics-warehouse", host: "warehouse.acme.io:5432", version: "15.6", sizeBytes: 512 * 1024 * 1024 * 1024,
    schemaCount: 6, tableCount: 64, activeConnections: 47, lastSync: ago(140), status: "idle",
    favorite: false, tags: ["olap", "read-replica"], environment: "production", ssl: true,
  },
  {
    id: "legacy", name: "legacy-billing", host: "10.0.4.12:5432", version: "13.9", sizeBytes: 9 * 1024 * 1024 * 1024,
    schemaCount: 3, tableCount: 28, activeConnections: 0, lastSync: ago(4320), status: "error",
    favorite: false, tags: ["deprecated"], environment: "production", ssl: false,
  },
];
