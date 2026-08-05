/** Domain types for the PostgreSQL Studio sandbox & connections. */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Environment = "production" | "staging" | "development";
export type ConnectionStatus = "connected" | "idle" | "syncing" | "error" | "disconnected";

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { table: string; column: string };
  defaultValue?: string;
  unique?: boolean;
  description?: string;
}

export interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  type: "btree" | "hash" | "gin" | "gist" | "brin";
  unique: boolean;
  sizeBytes: number;
  scans: number;
  usage: "high" | "moderate" | "low" | "unused";
  isPrimary?: boolean;
}

export interface ConstraintInfo {
  name: string;
  type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK" | "NOT NULL";
  columns: string[];
  detail?: string;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: "one-to-many" | "many-to-one" | "one-to-one";
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  sizeBytes: number;
  indexSizeBytes: number;
  columns: Column[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  hasPrimaryKey: boolean;
  bloatPercent: number;
  lastVacuum: string;
  seqScans: number;
  idxScans: number;
  description: string;
  sampleRows: Record<string, string | number | boolean>[];
}

export interface SchemaInfo {
  name: string;
  description: string;
  tableCount: number;
}

export interface SlowQuery {
  id: string;
  query: string;
  meanTimeMs: number;
  calls: number;
  totalTimeMs: number;
  rows: number;
  cacheHitPercent: number;
  lastRun: string;
}

export interface Insight {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  affectedObjects: string[];
  perfImpact: string;
  storageImpact: string;
  generatedAt: string;
  detail: string;
  sqlFix: string;
  estimatedImprovement: string;
  before: { label: string; value: string }[];
  after: { label: string; value: string }[];
  docsUrl: string;
  dismissed?: boolean;
}

export interface ActivityEvent {
  id: string;
  type: "query" | "insight" | "connection" | "vacuum" | "index" | "backup";
  title: string;
  detail: string;
  at: string;
}

export interface Connection {
  id: string;
  name: string;
  host: string;
  version: string;
  sizeBytes: number;
  schemaCount: number;
  tableCount: number;
  activeConnections: number;
  lastSync: string;
  status: ConnectionStatus;
  favorite: boolean;
  tags: string[];
  environment: Environment;
  ssl: boolean;
  isSandbox?: boolean;
}

export interface DbOverview {
  activeConnections: number;
  maxConnections: number;
  storageBytes: number;
  storageCapacityBytes: number;
  tableCount: number;
  schemaCount: number;
  replicationLagMs: number;
  replicationStatus: "healthy" | "lagging" | "down";
  slowQueryCount: number;
  locks: number;
  cacheHitRatio: number;
  transactionsPerSec: number;
  healthScore: number;
  commitsPerSec: number;
  rollbacksPerSec: number;
  uptime: string;
}
