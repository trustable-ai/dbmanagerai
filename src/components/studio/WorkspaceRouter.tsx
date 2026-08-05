import { AnimatePresence, motion } from "framer-motion";
import { useStudio } from "@/hooks/use-studio";
import { CardSkeletonGrid } from "./Common";
import { OverviewWorkspace } from "./workspaces/OverviewWorkspace";
import { TablesWorkspace } from "./workspaces/TablesWorkspace";
import { SchemaWorkspace } from "./workspaces/SchemaWorkspace";
import { TableDetailWorkspace } from "./workspaces/TableDetailWorkspace";
import { DuplicatesWorkspace } from "./workspaces/DuplicatesWorkspace";
import { OptimizeWorkspace } from "./workspaces/OptimizeWorkspace";
import { IndexesWorkspace } from "./workspaces/IndexesWorkspace";
import { SlowQueriesWorkspace } from "./workspaces/SlowQueriesWorkspace";
import { InsightsWorkspace } from "./workspaces/InsightsWorkspace";
import { ConnectionsWorkspace } from "./workspaces/ConnectionsWorkspace";
import { SqlWorkspace } from "./workspaces/SqlWorkspace";

export function WorkspaceRouter() {
  const { intent, thinking, run } = useStudio();

  const renderWorkspace = () => {
    switch (intent.kind) {
      case "overview":
        return <OverviewWorkspace onRun={run} />;
      case "tables":
      case "unknown":
        return <TablesWorkspace onRun={run} />;
      case "schema":
        return <SchemaWorkspace onRun={run} />;
      case "table-detail":
        return <TableDetailWorkspace table={intent.param} onRun={run} />;
      case "duplicates":
        return <DuplicatesWorkspace />;
      case "optimize":
        return <OptimizeWorkspace />;
      case "indexes":
        return <IndexesWorkspace />;
      case "slow-queries":
        return <SlowQueriesWorkspace onRun={run} />;
      case "insights":
        return <InsightsWorkspace />;
      case "connections":
        return <ConnectionsWorkspace />;
      case "sql":
        return <SqlWorkspace sql={intent.param} />;
      default:
        return <OverviewWorkspace onRun={run} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {thinking ? (
        <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-gradient-primary opacity-60" />
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <CardSkeletonGrid count={6} />
        </motion.div>
      ) : (
        <motion.div
          key={intent.kind + (intent.param ?? "")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderWorkspace()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
