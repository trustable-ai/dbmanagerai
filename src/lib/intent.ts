import { getTable, TABLES } from "./sandbox";

export type WorkspaceKind =
  | "overview"
  | "tables"
  | "schema"
  | "table-detail"
  | "duplicates"
  | "optimize"
  | "indexes"
  | "slow-queries"
  | "insights"
  | "connections"
  | "sql"
  | "unknown";

export interface Intent {
  kind: WorkspaceKind;
  /** Short AI-style caption rendered above the generated workspace. */
  caption: string;
  /** Optional focus payload (e.g. a table name). */
  param?: string;
}

const TABLE_NAMES = TABLES.map((t) => t.name);

function findTable(text: string): string | undefined {
  // direct match
  for (const name of TABLE_NAMES) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) return name;
  }
  // singular/plural loose match
  const words = text.toLowerCase().replace(/[^a-z_\s]/g, " ").split(/\s+/);
  for (const w of words) {
    const hit = TABLE_NAMES.find((n) => n === w || n === `${w}s` || `${n}s` === w || n.replace(/s$/, "") === w);
    if (hit) return hit;
  }
  return undefined;
}

/** Rule-based natural-language → workspace mapping. */
export function parseIntent(raw: string): Intent {
  const t = raw.toLowerCase().trim();

  if (!t) return { kind: "overview", caption: "Here's the health of your database." };

  // Raw SQL detection
  if (/^\s*(select|insert|update|delete|create|alter|drop|with|explain)\b/i.test(raw)) {
    return { kind: "sql", caption: "Prepared your SQL in an editable card.", param: raw };
  }

  const table = findTable(t);

  if (/\b(overview|dashboard|health|summary|status|home)\b/.test(t))
    return { kind: "overview", caption: "Executive overview of your database." };

  if (/\b(describe|detail|inspect|columns of|structure of|what.*in)\b/.test(t) && table)
    return { kind: "table-detail", caption: `Inspecting the ${table} table.`, param: table };

  if (/\b(schema|relationship|er diagram|entity|explain schema|model|diagram)\b/.test(t))
    return { kind: "schema", caption: "Interactive schema & relationship explorer." };

  if (/\b(duplicate|dupe|duplicates|redundant rows)\b/.test(t))
    return { kind: "duplicates", caption: "Duplicate analysis across your tables.", param: table };

  if (/\b(optimi[sz]e|slow query plan|execution plan|explain analyze|tune|rewrite)\b/.test(t))
    return { kind: "optimize", caption: "Query optimization report generated." };

  if (/\b(index|indexes|indices)\b/.test(t))
    return { kind: "indexes", caption: "Index usage dashboard." };

  if (/\b(slow quer|performance|latency|monitoring|hotspot|pg_stat)\b/.test(t))
    return { kind: "slow-queries", caption: "Performance monitoring workspace." };

  if (/\b(insights?|recommend|advice|suggest|improve|audit|analy[sz]e db)\b/.test(t))
    return { kind: "insights", caption: "AI insights across your database." };

  if (/\b(connections?|connect|database list|databases?|instances?|servers?)\b/.test(t))
    return { kind: "connections", caption: "Your database connections." };

  if (/\b(table|tables|list tables|show tables|relation)\b/.test(t) && !table)
    return { kind: "tables", caption: "All tables in your database." };

  if (table)
    return { kind: "table-detail", caption: `Inspecting the ${table} table.`, param: table };

  // fallback — show tables as a sensible default
  return {
    kind: "unknown",
    caption: `I couldn't map "${raw}" to a workspace — showing your tables instead.`,
  };
}

export interface Suggestion {
  label: string;
  command: string;
  hint: string;
}

export const SUGGESTIONS: Suggestion[] = [
  { label: "Database overview", command: "Show database overview", hint: "Executive dashboard" },
  { label: "Show tables", command: "Show tables", hint: "Animated table cards" },
  { label: "Explain schema", command: "Explain schema", hint: "ER diagram" },
  { label: "Describe users", command: "Describe the users table", hint: "Columns & sample rows" },
  { label: "Find duplicates", command: "Find duplicate records", hint: "Duplicate report" },
  { label: "Optimize query", command: "Optimize my slowest query", hint: "Before / after" },
  { label: "Show indexes", command: "Show indexes", hint: "Usage dashboard" },
  { label: "Slow queries", command: "Show slow queries", hint: "Performance monitor" },
  { label: "AI insights", command: "Show AI insights", hint: "Recommendations" },
  { label: "Connections", command: "Show connections", hint: "Manage databases" },
];

export { getTable };
