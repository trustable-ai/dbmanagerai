import type {
  Column,
  ConstraintInfo,
  IndexInfo,
  SchemaInfo,
  TableInfo,
  DbOverview,
} from "./types";

/* ------------------------------------------------------------------ *
 * Seeded pseudo-random generator — keeps the sandbox fully           *
 * deterministic so numbers never flicker between renders.            *
 * ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260805);
const rint = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

const FIRST = ["Ava", "Liam", "Noah", "Emma", "Olivia", "Mia", "Lucas", "Sofia", "Elena", "Marco", "Yuki", "Aria", "Kai", "Nina", "Omar", "Zoe"];
const LAST = ["Rossi", "Chen", "Kim", "Novak", "Silva", "Haddad", "Müller", "Costa", "Ivanov", "Tanaka", "Okafor", "Bianchi"];
const PRODUCTS = ["Aurora Desk Lamp", "Nimbus Backpack", "Ember Mug", "Quartz Keyboard", "Halo Monitor", "Drift Headphones", "Terra Notebook", "Pulse Charger", "Vega Chair", "Onyx Bottle"];
const CITIES = ["Milan", "Berlin", "Tokyo", "Austin", "Lisbon", "Toronto", "Nairobi", "Seoul"];
const STATUSES = ["pending", "paid", "shipped", "delivered", "refunded", "cancelled"];

/* ------------------------------------------------------------------ *
 * Schemas                                                            *
 * ------------------------------------------------------------------ */
export const SCHEMAS: SchemaInfo[] = [
  { name: "auth", description: "Identity, roles & permissions", tableCount: 4 },
  { name: "commerce", description: "Orders, products & payments", tableCount: 6 },
  { name: "logistics", description: "Inventory & shipments", tableCount: 2 },
  { name: "analytics", description: "Events, sessions & metrics", tableCount: 2 },
  { name: "audit", description: "Immutable audit trail", tableCount: 1 },
];

/* ------------------------------------------------------------------ *
 * Column / index / constraint builders                               *
 * ------------------------------------------------------------------ */
function col(name: string, type: string, opts: Partial<Column> = {}): Column {
  return { name, type, nullable: false, ...opts };
}

function idx(name: string, table: string, columns: string[], opts: Partial<IndexInfo> = {}): IndexInfo {
  const scans = opts.scans ?? rint(0, 90000);
  const usage: IndexInfo["usage"] = scans === 0 ? "unused" : scans < 500 ? "low" : scans < 20000 ? "moderate" : "high";
  return {
    name,
    table,
    columns,
    type: opts.type ?? "btree",
    unique: opts.unique ?? false,
    sizeBytes: opts.sizeBytes ?? rint(1, 60) * 1024 * 1024,
    scans,
    usage,
    isPrimary: opts.isPrimary,
  };
}

/* ------------------------------------------------------------------ *
 * Sample-row generators                                              *
 * ------------------------------------------------------------------ */
function iso(daysAgo: number, base = new Date("2026-08-05T10:00:00Z")): string {
  return new Date(base.getTime() - daysAgo * 86400000 - rint(0, 86400000)).toISOString();
}

function usersRows(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    return {
      id: 1000 + i,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      full_name: `${first} ${last}`,
      role: pick(["admin", "member", "member", "member", "viewer"]),
      is_active: rnd() > 0.12,
      created_at: iso(rint(1, 700)).slice(0, 10),
    };
  });
}

function ordersRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: 50000 + i,
    user_id: 1000 + rint(0, 400),
    status: pick(STATUSES),
    total: Number((rnd() * 480 + 12).toFixed(2)),
    currency: "EUR",
    placed_at: iso(rint(0, 90)).slice(0, 16).replace("T", " "),
  }));
}

function productsRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: 200 + i,
    name: pick(PRODUCTS),
    sku: `SKU-${rint(10000, 99999)}`,
    price: Number((rnd() * 240 + 5).toFixed(2)),
    stock: rint(0, 1200),
    category_id: rint(1, 12),
  }));
}

function paymentsRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: 80000 + i,
    order_id: 50000 + rint(0, 900),
    amount: Number((rnd() * 480 + 12).toFixed(2)),
    method: pick(["card", "card", "paypal", "wire", "wallet"]),
    status: pick(["captured", "captured", "authorized", "failed", "refunded"]),
    processed_at: iso(rint(0, 60)).slice(0, 16).replace("T", " "),
  }));
}

function genericRows(cols: string[], n: number) {
  return Array.from({ length: n }, (_, i) => {
    const row: Record<string, string | number | boolean> = {};
    cols.forEach((c) => {
      if (c === "id") row[c] = i + 1;
      else if (c.endsWith("_id")) row[c] = rint(1, 5000);
      else if (c.endsWith("_at")) row[c] = iso(rint(0, 120)).slice(0, 16).replace("T", " ");
      else if (c.includes("city")) row[c] = pick(CITIES);
      else if (c.includes("amount") || c.includes("total")) row[c] = Number((rnd() * 500).toFixed(2));
      else if (c.includes("count") || c.includes("quantity")) row[c] = rint(0, 999);
      else row[c] = pick(["active", "ok", "queued", "done", "review"]);
    });
    return row;
  });
}

/* ------------------------------------------------------------------ *
 * Table definitions                                                  *
 * ------------------------------------------------------------------ */
interface Def {
  name: string;
  schema: string;
  rows: number;
  size: number; // MB
  columns: Column[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  hasPk?: boolean;
  bloat?: number;
  description: string;
  sample: Record<string, string | number | boolean>[];
}

function pkC(cols: string[]): ConstraintInfo { return { name: `pk`, type: "PRIMARY KEY", columns: cols }; }
function fkC(name: string, cols: string[], ref: string): ConstraintInfo {
  return { name, type: "FOREIGN KEY", columns: cols, detail: `→ ${ref}` };
}

const DEFS: Def[] = [
  {
    name: "users", schema: "auth", rows: 48210, size: 42, bloat: 6,
    description: "Registered accounts with authentication metadata.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true, description: "Primary key" }),
      col("email", "varchar(255)", { unique: true }),
      col("full_name", "varchar(160)"),
      col("password_hash", "varchar(255)"),
      col("role", "varchar(32)", { defaultValue: "'member'" }),
      col("is_active", "boolean", { defaultValue: "true" }),
      col("last_login_at", "timestamptz", { nullable: true }),
      col("created_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("users_pkey", "users", ["id"], { unique: true, isPrimary: true, scans: 88420, sizeBytes: 3.2 * 1024 * 1024 }),
      idx("users_email_key", "users", ["email"], { unique: true, scans: 41200, sizeBytes: 4.1 * 1024 * 1024 }),
      idx("idx_users_role", "users", ["role"], { scans: 210, sizeBytes: 2.0 * 1024 * 1024 }),
      idx("idx_users_created_at", "users", ["created_at"], { scans: 0, sizeBytes: 5.4 * 1024 * 1024 }),
    ],
    constraints: [pkC(["id"]), { name: "users_email_key", type: "UNIQUE", columns: ["email"] }, { name: "users_role_check", type: "CHECK", columns: ["role"], detail: "role IN (admin, member, viewer)" }],
    sample: usersRows(8),
  },
  {
    name: "roles", schema: "auth", rows: 12, size: 1,
    description: "Role definitions for RBAC.",
    columns: [col("id", "int", { isPrimaryKey: true }), col("name", "varchar(64)", { unique: true }), col("description", "text", { nullable: true })],
    indexes: [idx("roles_pkey", "roles", ["id"], { unique: true, isPrimary: true, scans: 15200, sizeBytes: 16 * 1024 })],
    constraints: [pkC(["id"])],
    sample: genericRows(["id", "name", "description"], 6),
  },
  {
    name: "permissions", schema: "auth", rows: 96, size: 1,
    description: "Fine-grained permission flags mapped to roles.",
    columns: [col("id", "int", { isPrimaryKey: true }), col("role_id", "int", { isForeignKey: true, references: { table: "roles", column: "id" } }), col("resource", "varchar(64)"), col("action", "varchar(32)")],
    indexes: [idx("permissions_pkey", "permissions", ["id"], { unique: true, isPrimary: true, scans: 8800 })],
    constraints: [pkC(["id"]), fkC("fk_perm_role", ["role_id"], "roles.id")],
    sample: genericRows(["id", "role_id", "resource", "action"], 6),
  },
  {
    name: "sessions", schema: "auth", rows: 210400, size: 28, bloat: 22,
    description: "Active and expired login sessions. High churn table.",
    columns: [
      col("id", "uuid", { isPrimaryKey: true }),
      col("user_id", "bigint", { isForeignKey: true, references: { table: "users", column: "id" } }),
      col("ip_address", "inet"),
      col("user_agent", "text", { nullable: true }),
      col("expires_at", "timestamptz"),
      col("created_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("sessions_pkey", "sessions", ["id"], { unique: true, isPrimary: true, scans: 62000 }),
      idx("idx_sessions_user", "sessions", ["user_id"], { scans: 44100 }),
      idx("idx_sessions_expires", "sessions", ["expires_at"], { scans: 3, sizeBytes: 9 * 1024 * 1024 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_sessions_user", ["user_id"], "users.id")],
    sample: genericRows(["id", "user_id", "ip_address", "expires_at", "created_at"], 6),
  },
  {
    name: "products", schema: "commerce", rows: 8420, size: 18,
    description: "Product catalog with pricing & stock references.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("name", "varchar(200)"),
      col("sku", "varchar(40)", { unique: true }),
      col("price", "numeric(10,2)"),
      col("category_id", "int", { isForeignKey: true, references: { table: "categories", column: "id" } }),
      col("description", "text", { nullable: true }),
      col("created_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("products_pkey", "products", ["id"], { unique: true, isPrimary: true, scans: 71000 }),
      idx("products_sku_key", "products", ["sku"], { unique: true, scans: 33000 }),
      idx("idx_products_category", "products", ["category_id"], { scans: 12500 }),
    ],
    constraints: [pkC(["id"]), { name: "products_sku_key", type: "UNIQUE", columns: ["sku"] }, fkC("fk_products_category", ["category_id"], "categories.id")],
    sample: productsRows(8),
  },
  {
    name: "categories", schema: "commerce", rows: 64, size: 1,
    description: "Hierarchical product categories.",
    columns: [col("id", "int", { isPrimaryKey: true }), col("name", "varchar(80)"), col("parent_id", "int", { nullable: true, isForeignKey: true, references: { table: "categories", column: "id" } })],
    indexes: [idx("categories_pkey", "categories", ["id"], { unique: true, isPrimary: true, scans: 41000 })],
    constraints: [pkC(["id"]), fkC("fk_categories_parent", ["parent_id"], "categories.id")],
    sample: genericRows(["id", "name", "parent_id"], 6),
  },
  {
    name: "orders", schema: "commerce", rows: 184920, size: 46, bloat: 14,
    description: "Customer orders — most queried table in the database.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("user_id", "bigint", { isForeignKey: true, references: { table: "users", column: "id" } }),
      col("status", "varchar(20)", { defaultValue: "'pending'" }),
      col("total", "numeric(12,2)"),
      col("currency", "char(3)", { defaultValue: "'EUR'" }),
      col("placed_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("orders_pkey", "orders", ["id"], { unique: true, isPrimary: true, scans: 92000 }),
      idx("idx_orders_user", "orders", ["user_id"], { scans: 51000 }),
      idx("idx_orders_status", "orders", ["status"], { scans: 240, sizeBytes: 6 * 1024 * 1024 }),
      idx("idx_orders_placed_at", "orders", ["placed_at"], { scans: 28000 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_orders_user", ["user_id"], "users.id")],
    sample: ordersRows(8),
  },
  {
    name: "order_items", schema: "commerce", rows: 612300, size: 54, bloat: 9,
    description: "Line items linking orders to products.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("order_id", "bigint", { isForeignKey: true, references: { table: "orders", column: "id" } }),
      col("product_id", "bigint", { isForeignKey: true, references: { table: "products", column: "id" } }),
      col("quantity", "int", { defaultValue: "1" }),
      col("unit_price", "numeric(10,2)"),
    ],
    indexes: [
      idx("order_items_pkey", "order_items", ["id"], { unique: true, isPrimary: true, scans: 60000 }),
      idx("idx_items_order", "order_items", ["order_id"], { scans: 88000 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_items_order", ["order_id"], "orders.id"), fkC("fk_items_product", ["product_id"], "products.id")],
    sample: genericRows(["id", "order_id", "product_id", "quantity", "unit_price"], 6),
  },
  {
    name: "payments", schema: "commerce", rows: 176500, size: 32, bloat: 11,
    description: "Payment transactions per order.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("order_id", "bigint", { isForeignKey: true, references: { table: "orders", column: "id" } }),
      col("amount", "numeric(12,2)"),
      col("method", "varchar(20)"),
      col("status", "varchar(20)"),
      col("processed_at", "timestamptz", { nullable: true }),
    ],
    indexes: [
      idx("payments_pkey", "payments", ["id"], { unique: true, isPrimary: true, scans: 47000 }),
      idx("idx_payments_order", "payments", ["order_id"], { scans: 39000 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_payments_order", ["order_id"], "orders.id")],
    sample: paymentsRows(8),
  },
  {
    name: "invoices", schema: "commerce", rows: 174000, size: 26,
    description: "Generated invoices for captured payments.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("payment_id", "bigint", { isForeignKey: true, references: { table: "payments", column: "id" } }),
      col("number", "varchar(24)", { unique: true }),
      col("issued_at", "date"),
      col("amount", "numeric(12,2)"),
    ],
    indexes: [
      idx("invoices_pkey", "invoices", ["id"], { unique: true, isPrimary: true, scans: 22000 }),
      idx("invoices_number_key", "invoices", ["number"], { unique: true, scans: 9000 }),
    ],
    constraints: [pkC(["id"]), { name: "invoices_number_key", type: "UNIQUE", columns: ["number"] }, fkC("fk_invoices_payment", ["payment_id"], "payments.id")],
    sample: genericRows(["id", "payment_id", "number", "issued_at", "amount"], 6),
  },
  {
    name: "inventory", schema: "logistics", rows: 8420, size: 12, bloat: 5,
    description: "Per-product stock levels across warehouses.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("product_id", "bigint", { isForeignKey: true, references: { table: "products", column: "id" } }),
      col("warehouse", "varchar(40)"),
      col("quantity", "int", { defaultValue: "0" }),
      col("reorder_level", "int", { defaultValue: "10" }),
      col("updated_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("inventory_pkey", "inventory", ["id"], { unique: true, isPrimary: true, scans: 34000 }),
      idx("idx_inventory_product", "inventory", ["product_id"], { scans: 27000 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_inventory_product", ["product_id"], "products.id")],
    sample: genericRows(["id", "product_id", "warehouse", "quantity", "updated_at"], 6),
  },
  {
    name: "shipments", schema: "logistics", rows: 158200, size: 30, bloat: 12,
    description: "Outbound shipments and tracking status.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("order_id", "bigint", { isForeignKey: true, references: { table: "orders", column: "id" } }),
      col("carrier", "varchar(40)"),
      col("tracking_number", "varchar(64)", { nullable: true }),
      col("status", "varchar(24)"),
      col("shipped_at", "timestamptz", { nullable: true }),
    ],
    indexes: [
      idx("shipments_pkey", "shipments", ["id"], { unique: true, isPrimary: true, scans: 29000 }),
      idx("idx_shipments_order", "shipments", ["order_id"], { scans: 21000 }),
      idx("idx_shipments_tracking", "shipments", ["tracking_number"], { scans: 40, sizeBytes: 7 * 1024 * 1024 }),
    ],
    constraints: [pkC(["id"]), fkC("fk_shipments_order", ["order_id"], "orders.id")],
    sample: genericRows(["id", "order_id", "carrier", "status", "shipped_at"], 6),
  },
  {
    name: "events", schema: "analytics", rows: 2140000, size: 88, bloat: 18,
    description: "Raw product analytics events. Largest table.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("session_id", "uuid"),
      col("user_id", "bigint", { nullable: true }),
      col("name", "varchar(80)"),
      col("properties", "jsonb", { nullable: true }),
      col("occurred_at", "timestamptz"),
    ],
    indexes: [
      idx("events_pkey", "events", ["id"], { unique: true, isPrimary: true, scans: 12000 }),
      idx("idx_events_name", "events", ["name"], { scans: 6400 }),
      idx("idx_events_props", "events", ["properties"], { type: "gin", scans: 900, sizeBytes: 48 * 1024 * 1024 }),
      idx("idx_events_occurred", "events", ["occurred_at"], { scans: 3300 }),
    ],
    constraints: [pkC(["id"])],
    sample: genericRows(["id", "session_id", "user_id", "name", "occurred_at"], 6),
  },
  {
    name: "notifications", schema: "analytics", rows: 421000, size: 24, bloat: 27,
    description: "User-facing notification queue. Missing a primary key.",
    hasPk: false,
    columns: [
      col("user_id", "bigint", { isForeignKey: true, references: { table: "users", column: "id" } }),
      col("channel", "varchar(20)"),
      col("payload", "jsonb", { nullable: true }),
      col("read", "boolean", { defaultValue: "false" }),
      col("created_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("idx_notif_user", "notifications", ["user_id"], { scans: 18000 }),
    ],
    constraints: [fkC("fk_notif_user", ["user_id"], "users.id")],
    sample: genericRows(["user_id", "channel", "read", "created_at"], 6),
  },
  {
    name: "audit_logs", schema: "audit", rows: 986400, size: 64, bloat: 8,
    description: "Immutable append-only audit trail.",
    columns: [
      col("id", "bigint", { isPrimaryKey: true }),
      col("actor_id", "bigint", { nullable: true }),
      col("action", "varchar(64)"),
      col("entity", "varchar(64)"),
      col("entity_id", "varchar(64)"),
      col("metadata", "jsonb", { nullable: true }),
      col("created_at", "timestamptz", { defaultValue: "now()" }),
    ],
    indexes: [
      idx("audit_logs_pkey", "audit_logs", ["id"], { unique: true, isPrimary: true, scans: 5400 }),
      idx("idx_audit_entity", "audit_logs", ["entity", "entity_id"], { scans: 8900 }),
      idx("idx_audit_created", "audit_logs", ["created_at"], { scans: 4100 }),
    ],
    constraints: [pkC(["id"])],
    sample: genericRows(["id", "actor_id", "action", "entity", "created_at"], 6),
  },
];

/* ------------------------------------------------------------------ *
 * Public API                                                         *
 * ------------------------------------------------------------------ */
export const TABLES: TableInfo[] = DEFS.map((d) => ({
  name: d.name,
  schema: d.schema,
  rowCount: d.rows,
  sizeBytes: d.size * 1024 * 1024,
  indexSizeBytes: d.indexes.reduce((s, i) => s + i.sizeBytes, 0),
  columns: d.columns,
  indexes: d.indexes,
  constraints: d.constraints,
  hasPrimaryKey: d.hasPk !== false,
  bloatPercent: d.bloat ?? rint(2, 10),
  lastVacuum: iso(rint(0, 14)),
  seqScans: rint(20, 4000),
  idxScans: d.indexes.reduce((s, i) => s + i.scans, 0),
  description: d.description,
  sampleRows: d.sample,
}));

export function getTable(name: string): TableInfo | undefined {
  return TABLES.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

export const ALL_INDEXES: IndexInfo[] = TABLES.flatMap((t) => t.indexes);

export const TOTAL_SIZE_BYTES = TABLES.reduce((s, t) => s + t.sizeBytes + t.indexSizeBytes, 0);

export const DB_OVERVIEW: DbOverview = {
  activeConnections: 34,
  maxConnections: 100,
  storageBytes: TOTAL_SIZE_BYTES,
  storageCapacityBytes: 512 * 1024 * 1024,
  tableCount: TABLES.length,
  schemaCount: SCHEMAS.length,
  replicationLagMs: 42,
  replicationStatus: "healthy",
  slowQueryCount: 7,
  locks: 3,
  cacheHitRatio: 98.7,
  transactionsPerSec: 1284,
  healthScore: 87,
  commitsPerSec: 1240,
  rollbacksPerSec: 44,
  uptime: "18d 4h",
};

/** Small deterministic sparkline series for widgets. */
export function series(seed: number, points = 24, min = 20, max = 100): number[] {
  const r = mulberry32(seed);
  let v = (min + max) / 2;
  return Array.from({ length: points }, () => {
    v += (r() - 0.5) * (max - min) * 0.35;
    v = Math.max(min, Math.min(max, v));
    return Math.round(v);
  });
}
