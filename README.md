# Nuvola Studio — AI PostgreSQL Workspace

A fully graphical PostgreSQL management workspace driven by natural language.

There is no query console to learn and no menu tree to hunt through. You type
what you want in the prompt bar at the bottom — *show tables*, *explain schema*,
*find duplicate records*, *optimize my slowest query* — and the studio builds the
right workspace for it: dashboards, cards, diagrams, charts and SQL, never a wall
of text. Every answer is a screen you can explore.

![Nuvola Studio](screenshot.png)

## Asking for what you want

The prompt bar is always in reach. Start typing and it offers suggestions —
database overview, schema explorer, duplicates, index usage, slow queries, AI
insights. Paste raw SQL and it lands in an editable, copyable SQL card instead.
Name a table and the studio opens that table. Press ⌘K (Ctrl+K) for a palette
that jumps straight to any workspace, table or common question. The sidebar keeps
the same destinations one click away, and your recent commands stay in history.

While the workspace is being assembled you see the studio thinking, then a short
caption explaining what it built for you.

## The workspaces

**Overview** — an executive dashboard: a composite health score, gauges for cache
hit ratio, connections, storage and locks, transactions per second, table and
schema counts, replication status, uptime, and sparkline trends, alongside a
recent activity feed.

**Tables** — every table across all schemas as searchable cards showing row
counts, size, index size, primary keys and relationships. Click through to a
table.

**Table detail** — one table in full: columns with types, nullability, keys and
defaults; indexes; constraints; row count, total and index size, bloat and last
vacuum; plus a paged preview of sample rows.

**Schema explorer** — all tables with their columns expandable inline, and a
relationship graph drawing the foreign keys between them.

**Indexes** — an index usage dashboard: total count and size, scan counts, and
which indexes are high-use, moderate, low or entirely unused — with the wasted
space they occupy.

**Performance** — the slow-query monitor, styled after `pg_stat_statements`:
worst offenders by mean latency, call counts, total time, rows returned and cache
hit rate, with a formatted statement and a 24-hour latency trend for whichever
query you select.

**Optimizer** — a before/after report for a slow query: the original and the
rewritten statement side by side, an execution-plan diff, and the measured
improvement in latency, rows read and buffer hits.

**Duplicates** — duplicate analysis across a table: how many duplicate groups,
how many rows are affected, how many are removable, an overall data-quality
score, the flagged rows highlighted in a table, and the deduplication SQL ready
to copy.

**AI Insights** — continuous analysis of the database, presented as ranked
findings by severity (critical, high, medium, low). Each insight opens with its
confidence score, affected objects, expected performance and storage impact, a
before/after comparison, a documentation link, and the SQL fix that applies it.
Insights can be dismissed.

**Connections** — the databases you manage, each with host, version, size,
schema and table counts, active connections, environment, SSL and status. Mark
favourites, test a connection, duplicate, disconnect or add a new PostgreSQL
database. The built-in sandbox database sits at the top and can be reset,
recreated, duplicated or restored to demo data at any time.

Every SQL block in the studio is a first-class card: syntax-highlighted, editable
and copyable in place.

## The experience

Dark and light mode, a collapsible sidebar, glassy cards and gradient accents,
staggered motion as workspaces come in, sparklines and gauges instead of bare
numbers, and a layout that folds from a wide desktop studio to a mobile screen
with a slide-over navigation sheet.

## How it is put together

The studio is a React and TypeScript single-page app (Vite, Tailwind CSS,
shadcn/ui, Framer Motion, Recharts). It ships with the sandbox database built in:
a deterministic ~200 MB demo dataset of schemas, tables, indexes, sample rows,
slow queries and insights, so every screen is populated and every number stays
stable from one visit to the next. Natural-language commands are matched to
workspaces in the browser, which is what makes the studio respond instantly and
work with no database attached.

The repository also carries a serverless chat action for Apache OpenServerless,
ready for wiring the prompt bar to a live language model and to real PostgreSQL
connections.

## Getting started

```bash
npm install
npm run dev
```

The app opens on the sandbox database with the overview workspace — no
connection setup required.
