import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileJson,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Row = Record<string, string | number | boolean>;

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Row[], cols: string[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function DataTable({
  rows,
  title,
  pageSize = 8,
  selectable = true,
}: {
  rows: Row[];
  title?: string;
  pageSize?: number;
  selectable?: boolean;
}) {
  const cols = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) => cols.some((c) => String(r[c]).toLowerCase().includes(q)));
    }
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = a[sort.col];
        const bv = b[sort.col];
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, cols, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (col: string) =>
    setSort((s) => (s?.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" }));

  const toggleRow = (i: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {title && <span className="text-sm font-semibold">{title}</span>}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
            {filtered.length} rows
          </span>
          {selected.size > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {selected.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Filter…"
              className="h-8 w-full pl-8 text-sm sm:w-44"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => download(`${title ?? "export"}.csv`, toCsv(filtered, cols), "text/csv") || toast.success("CSV exported")}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => download(`${title ?? "export"}.json`, JSON.stringify(filtered, null, 2), "application/json") || toast.success("JSON exported")}>
            <FileJson className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {selectable && <th className="w-10 px-3 py-2.5" />}
              {cols.map((c) => (
                <th key={c} className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                    <span className="font-mono text-xs uppercase tracking-wide">{c}</span>
                    {sort?.col === c ? (
                      sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const globalIdx = safePage * pageSize + i;
              const isSel = selected.has(globalIdx);
              return (
                <motion.tr
                  key={globalIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn("border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40", isSel && "bg-primary/[0.06]")}
                >
                  {selectable && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleRow(globalIdx)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-border accent-primary"
                      />
                    </td>
                  )}
                  {cols.map((c) => (
                    <td key={c} className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px]">
                      <CellValue value={r[c]} />
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          Page {safePage + 1} of {pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: string | number | boolean }) {
  if (typeof value === "boolean")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium", value ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>
        {value ? "true" : "false"}
      </span>
    );
  if (typeof value === "number") return <span className="text-warning tabular-nums">{value}</span>;
  return <span className="text-foreground/90">{String(value)}</span>;
}
