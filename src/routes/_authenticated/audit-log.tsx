import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { formatInt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log — Next Tsaraba" },
      { name: "description", content: "Full activity log of all changes across the system." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditLogPage,
});

const TABLE_NAMES = [
  "production_logs", "sales_records", "expenses", "raw_materials",
  "agents", "ingredient_usage_logs", "proforma_orders", "printing_jobs",
  "cash_flow_entries", "finished_goods_stock", "cash_reconciliation",
];

function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const q = useQuery({
    queryKey: ["audit-logs", tableFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*, profiles(full_name, email)")
        .order("performed_at", { ascending: false })
        .limit(200);

      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      INSERT: "bg-emerald-100 text-emerald-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[action] ?? ""}>{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6" /> Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">Full activity trail of all changes across the system.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger><SelectValue placeholder="All tables" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {TABLE_NAMES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => q.refetch()}>Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity log</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (q.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No audit entries yet. Changes will appear here once you start using the app.</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[700px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Table</th>
                      <th className="px-4 py-3">Record</th>
                      <th className="px-4 py-3">Changed fields</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {q.data!.map((r: any) => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(r.performed_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">{r.profiles?.full_name ?? r.profiles?.email ?? "System"}</td>
                        <td className="px-4 py-3">{actionBadge(r.action)}</td>
                        <td className="px-4 py-3 capitalize">{r.table_name.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {r.record_id ? r.record_id.slice(0, 8) + "…" : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.changed_fields ? (
                            <div className="flex flex-wrap gap-1">
                              {(r.changed_fields as string[]).map((f: string) => (
                                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
