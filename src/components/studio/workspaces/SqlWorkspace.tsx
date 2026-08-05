import { Terminal } from "lucide-react";
import { TABLES } from "@/lib/sandbox";
import { WorkspaceHeader } from "../Common";
import { SqlCard } from "../SqlCard";
import { DataTable } from "../DataTable";
import { Card } from "@/components/ui/card";

export function SqlWorkspace({ sql }: { sql?: string }) {
  const query = sql?.trim() || "SELECT * FROM auth.users LIMIT 100;";
  const sample = TABLES[0].sampleRows;

  return (
    <div className="space-y-6">
      <WorkspaceHeader icon={Terminal} title="SQL Editor" subtitle="Run against Sandbox DB" />
      <SqlCard sql={query} title="Query" />
      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Result preview</p>
        <DataTable rows={sample} title="Result set" />
      </Card>
    </div>
  );
}
