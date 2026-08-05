import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Command as CommandIcon, Sparkles } from "lucide-react";
import { useStudio } from "@/hooks/use-studio";
import { SUGGESTIONS } from "@/lib/intent";
import { cn } from "@/lib/utils";

export function PromptBar() {
  const { run, thinking, caption, sidebarCollapsed } = useStudio();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const cmd = value.trim();
    if (!cmd || thinking) return;
    run(cmd);
    setValue("");
    inputRef.current?.blur();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const showSuggestions = focused || value.length > 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-[left] duration-300",
        sidebarCollapsed ? "lg:left-[76px]" : "lg:left-64",
      )}
    >
      {/* fade so content scrolls out elegantly behind the bar */}
      <div className="h-16 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-auto bg-background/80 px-3 pb-4 pt-1 backdrop-blur-xl sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          {/* Suggestion chips */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-2.5 flex flex-wrap gap-1.5"
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.command}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      run(s.command);
                      setValue("");
                    }}
                    className="group flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span>{s.label}</span>
                    <span className="text-muted-foreground/60 group-hover:text-primary">{s.hint}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI caption above the bar */}
          <AnimatePresence mode="wait">
            {caption && !showSuggestions && (
              <motion.div
                key={caption}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{caption}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The bar */}
          <div
            className={cn(
              "group relative flex items-end gap-2 rounded-2xl border bg-card/90 p-2 shadow-elegant backdrop-blur-xl transition-all",
              focused && "border-primary/50 shadow-glow",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 blur-xl transition-opacity",
                focused && "opacity-10",
              )}
            />
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white">
              {thinking ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>

            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={onKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask your database anything — “show tables”, “find duplicates”, “optimize query”…"
              className="relative max-h-36 min-h-[36px] flex-1 resize-none self-center bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />

            <div className="relative flex shrink-0 items-center gap-1.5">
              <span className="hidden items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
                <CommandIcon className="h-3 w-3" />K
              </span>
              <button
                onClick={submit}
                disabled={!value.trim() || thinking}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  value.trim() && !thinking
                    ? "bg-gradient-primary text-white shadow-soft hover:brightness-110"
                    : "bg-muted text-muted-foreground",
                )}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
            Nuvola Studio turns natural language into live PostgreSQL workspaces · responses are visual, not chat
          </p>
        </div>
      </div>
    </div>
  );
}
