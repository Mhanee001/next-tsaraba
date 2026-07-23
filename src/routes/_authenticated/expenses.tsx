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
import { Receipt } from "lucide-react";
import { formatNaira, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

const CATEGORIES = ["Fuel", "Maintenance", "Food", "Wages", "Utilities", "Transport", "Supplies", "Misc"];

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Next Tsaraba" },
      { name: "description", content: "Daily expenses by category." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    expense_date: todayISO(),
    category: CATEGORIES[0],
    amount: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["expenses-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const rows = q.data ?? [];
    const today = todayISO();
    const todayTotal = rows.filter((r: any) => r.expense_date === today).reduce((s: number, r: any) => s + Number(r.amount), 0);
    const byCat: Record<string, number> = {};
    rows.forEach((r: any) => { byCat[r.category] = (byCat[r.category] ?? 0) + Number(r.amount); });
    return { todayTotal, byCat };
  }, [q.data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Enter an amount");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("expenses").insert({
      expense_date: form.expense_date,
      category: form.category,
      amount: amt,
      description: form.description || null,
      logged_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "expenses", action: "INSERT", new_values: { expense_date: form.expense_date, category: form.category, amount: amt, description: form.description || null, logged_by: userData.user?.id ?? null } }); } catch { /* silent */ }
    toast.success("Expense logged");
    setForm({ ...form, amount: "", description: "" });
    qc.invalidateQueries({ queryKey: ["expenses-recent"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { data: oldData } = await supabase.from("expenses").select("*").eq("id", id).single();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "expenses", record_id: id, action: "DELETE", old_values: oldData ?? undefined }); } catch { /* silent */ }
    qc.invalidateQueries({ queryKey: ["expenses-recent"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6" /> Expenses
        </h1>
        <p className="text-sm text-muted-foreground">Log daily spend by category. Today: {formatNaira(totals.todayTotal)}.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">New expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₦)</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Log expense"}</Button>
            </form>

            {Object.keys(totals.byCat).length > 0 && (
              <div className="mt-6 space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Recent totals by category</div>
                {Object.entries(totals.byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="font-medium">{formatNaira(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent expenses</CardTitle></CardHeader>
          <CardContent className="p-0">
            {q.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : (q.data ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {q.data!.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.expense_date}</td>
                        <td className="px-4 py-3">{r.category}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.description ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatNaira(r.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Delete</Button>
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
    </div>
  );
}
