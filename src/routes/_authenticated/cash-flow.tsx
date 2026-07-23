import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { formatNaira, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow — Next Tsaraba" },
      { name: "description", content: "Track cash inflows, outflows, and transfers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CashFlowPage,
});

const CATEGORIES = ["sales", "expense", "loan", "investment", "bank_deposit", "bank_withdrawal", "transfer", "other"];

function CashFlowPage() {
  const qc = useQueryClient();
  const today = todayISO();
  const [showForm, setShowForm] = useState(false);
  const [range, setRange] = useState("30d");
  const [form, setForm] = useState({
    entry_date: today,
    type: "inflow",
    category: "sales",
    amount: "",
    source_or_destination: "",
    description: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const startDate = useMemo(() => {
    const d = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const entriesQ = useQuery({
    queryKey: ["cash-flow", startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_entries")
        .select("*")
        .gte("entry_date", startDate)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const summary = useMemo(() => {
    const entries = entriesQ.data ?? [];
    const inflows = entries.filter((r: any) => r.type === "inflow").reduce((s: number, r: any) => s + Number(r.amount), 0);
    const outflows = entries.filter((r: any) => r.type === "outflow").reduce((s: number, r: any) => s + Number(r.amount), 0);
    const transfers = entries.filter((r: any) => r.type === "transfer").reduce((s: number, r: any) => s + Number(r.amount), 0);
    const net = inflows - outflows;
    return { inflows, outflows, transfers, net };
  }, [entriesQ.data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Amount is required");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("cash_flow_entries").insert({
      entry_date: form.entry_date,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      source_or_destination: form.source_or_destination || null,
      description: form.description || null,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "cash_flow_entries", action: "INSERT", new_values: { entry_date: form.entry_date, type: form.type, category: form.category, amount: Number(form.amount), source_or_destination: form.source_or_destination || null, description: form.description || null, notes: form.notes || null, logged_by: userData.user?.id ?? null } }); } catch { /* silent */ }
    toast.success("Entry saved");
    setForm({ entry_date: today, type: "inflow", category: "sales", amount: "", source_or_destination: "", description: "", notes: "" });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["cash-flow"] });
  };

  const typeIcon = (t: string) => {
    if (t === "inflow") return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
    if (t === "outflow") return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { data: oldEntry } = await supabase.from("cash_flow_entries").select("*").eq("id", id).single();
    const { error } = await supabase.from("cash_flow_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "cash_flow_entries", record_id: id, action: "DELETE", old_values: oldEntry ?? undefined }); } catch { /* silent */ }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["cash-flow"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6" /> Cash Flow
          </h1>
          <p className="text-sm text-muted-foreground">Monitor cash movements — inflows, outflows, and transfers.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> New entry</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Inflows</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-600">{formatNaira(summary.inflows)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Outflows</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">{formatNaira(summary.outflows)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Transfers</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600">{formatNaira(summary.transfers)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Net cash flow</div>
            <div className={`mt-1 text-2xl font-semibold ${summary.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {summary.net >= 0 ? "+" : ""}{formatNaira(summary.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New cash flow entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inflow">Inflow</SelectItem>
                      <SelectItem value="outflow">Outflow</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₦) *</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Source / destination</Label>
                  <Input value={form.source_or_destination} onChange={(e) => setForm({ ...form, source_or_destination: e.target.value })} placeholder="Bank, cash, agent…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save entry"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Entries</CardTitle>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="90d">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {entriesQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (entriesQ.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No entries in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Source/Dest</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entriesQ.data!.map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">{r.entry_date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {typeIcon(r.type)}
                          <span className="capitalize">{r.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{r.category.replace("_", " ")}</td>
                      <td className="px-4 py-3">{r.description ?? "—"}</td>
                      <td className="px-4 py-3">{r.source_or_destination ?? "—"}</td>
                      <td className={`px-4 py-3 text-right font-medium ${r.type === "inflow" ? "text-emerald-600" : r.type === "outflow" ? "text-red-600" : "text-blue-600"}`}>
                        {r.type === "inflow" ? "+" : r.type === "outflow" ? "-" : ""}{formatNaira(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Del</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
