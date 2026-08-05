import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { parseIntent, type Intent } from "@/lib/intent";

interface HistoryItem {
  id: number;
  command: string;
  caption: string;
  at: number;
}

interface StudioState {
  intent: Intent;
  caption: string;
  thinking: boolean;
  history: HistoryItem[];
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  run: (command: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

const StudioContext = createContext<StudioState | null>(null);

let hid = 0;

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = useState<Intent>(() => parseIntent("overview"));
  const [caption, setCaption] = useState(intent.caption);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("studio-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("studio-theme", theme);
  }, [theme]);

  const run = useCallback((command: string) => {
    const parsed = parseIntent(command);
    setThinking(true);
    setCaption("");
    if (command.trim()) {
      setHistory((h) => [{ id: ++hid, command, caption: parsed.caption, at: Date.now() }, ...h].slice(0, 30));
    }
    // Simulate the AI "generating" the workspace — a short, polished delay.
    window.setTimeout(() => {
      setIntent(parsed);
      setCaption(parsed.caption);
      setThinking(false);
    }, 480);
  }, []);

  const value = useMemo<StudioState>(
    () => ({
      intent,
      caption,
      thinking,
      history,
      theme,
      sidebarCollapsed,
      run,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
    }),
    [intent, caption, thinking, history, theme, sidebarCollapsed, run],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
