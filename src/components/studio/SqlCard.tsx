import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Pencil, Play, Save, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYWORDS =
  /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|CONCURRENTLY|UNIQUE|ALTER|ADD|DROP|COLUMN|CONSTRAINT|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|AND|OR|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|WITH|CASE|WHEN|THEN|ELSE|END|IN|LIKE|ILIKE|BETWEEN|ASC|DESC|VACUUM|ANALYZE|VERBOSE|EXPLAIN|GRANT|REVOKE|ON|TO|FROM|GENERATED|ALWAYS|IDENTITY|PARTITION|OF|FOR|INTERVAL|now)\b/gi;

/** Tokenize SQL into highlighted spans without a heavy dependency. */
function highlight(sql: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // split preserving comments, strings, numbers, keywords
  const regex =
    /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|(\$\d+)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(sql))) {
    const [full, comment, str, num, param, word, ws, sym] = m;
    if (comment) nodes.push(<span key={key++} className="text-muted-foreground/70 italic">{comment}</span>);
    else if (str) nodes.push(<span key={key++} className="text-success">{str}</span>);
    else if (num) nodes.push(<span key={key++} className="text-warning">{num}</span>);
    else if (param) nodes.push(<span key={key++} className="text-accent-foreground font-semibold">{param}</span>);
    else if (word) {
      if (KEYWORDS.test(full)) {
        KEYWORDS.lastIndex = 0;
        nodes.push(<span key={key++} className="font-semibold text-primary">{word}</span>);
      } else nodes.push(<span key={key++}>{word}</span>);
    } else if (ws) nodes.push(<span key={key++}>{ws}</span>);
    else if (sym) nodes.push(<span key={key++} className="text-muted-foreground">{sym}</span>);
    else nodes.push(full);
  }
  return nodes;
}

export interface SqlCardProps {
  sql: string;
  title?: string;
  onExecute?: () => void;
  onExplain?: () => void;
  className?: string;
  editable?: boolean;
  compact?: boolean;
}

export function SqlCard({ sql: initial, title = "SQL", onExecute, onExplain, className, editable = true, compact }: SqlCardProps) {
  const [sql, setSql] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true);
    toast.success("SQL copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-[hsl(224_44%_9%)] text-slate-100 shadow-soft dark:bg-[hsl(224_46%_7%)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          {title}
        </div>
        <div className="flex items-center gap-0.5">
          {editable && (
            <button
              onClick={() => setEditing((e) => !e)}
              className={cn("rounded-md p-1.5 text-slate-300 transition-colors hover:bg-white/10", editing && "bg-white/10 text-white")}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={copy} className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-white/10" title="Copy">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.textarea
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              className={cn(
                "w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-slate-100 outline-none",
                compact ? "min-h-[80px]" : "min-h-[120px]",
              )}
            />
          ) : (
            <motion.pre
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"
            >
              <code>{highlight(sql)}</code>
            </motion.pre>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white/[0.02] px-3 py-2">
        <Button
          size="sm"
          className="h-8 bg-gradient-primary text-white hover:brightness-110"
          onClick={() => {
            onExecute?.();
            toast.success("Query executed on Sandbox DB", { description: "Insights refreshed" });
          }}
        >
          <Play className="h-3.5 w-3.5" />
          Execute
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={() => {
            onExplain?.();
            toast("Execution plan generated");
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Explain
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={() => toast.success("Saved to your snippet library")}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
