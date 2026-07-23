import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertTriangle } from "lucide-react";
import { formatNaira, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/reconciliation")({
  head: () => ({
    meta: [
      { title: "Cash reconciliation — Next Tsaraba" },
      { name: "description", content: "Daily cash reconciliation with variance warnings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReconPage,
});

function ReconPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [actual, setActual] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const dayQ = useQuery({
    queryKey: ["recon-day", date],
    queryFn: async () => {
      const [sales, expenses, existing] = await Promise.all([
        supabase.from("sales_records").select("gross_amount, cash_collected, credit_amount, discount").eq("sale_date", date),
        supabase.from("expenses").select("amount").eq("expense_date", date),
        supabase.from("cash_reconciliation").select("*").eq("recon_date", date).maybeSingle(),
      ]);
      if (sales.error) throw sales.error;
      if (expenses.error) throw expenses.error;
      if (existing.error) throw existing.error;
      return { sales: sales.data ?? [], expenses: expenses.data ?? [], existing: existing.data };
    },
  });

  const historyQ = useQuery({
    queryKey: ["recon-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_reconciliation")
        .select("*")
        .order("recon_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const s = dayQ.data?.sales ?? [];
    const e = dayQ.data?.expenses ?? [];
    const total_production_value = s.reduce((a: number, r: any) => a + Number(r.gross_amount), 0);
    const total_cash_collected = s.reduce((a: number, r: any) => a + Number(r.cash_collected), 0);
    const total_credit_issued = s.reduce((a: number, r: any) => a + Number(r.credit_amount), 0);
    const total_discounts = s.reduce((a: number, r: any) => a + Number(r.discount), 0);
    const total_expenses = e.reduce((a: number, r: any) => a + Number(r.amount), 0);
    const expected_cash = total_cash_collected - total_expenses;
    return { total_production_value, total_cash_collected, total_credit_issued, total_discounts, total_expenses, expected_cash };
  }, [dayQ.data]);

  useEffect(() => {
    const ex = dayQ.data?.existing;
    setActual(ex ? String(ex.actual_cash_at_hand) : "");
    setNotes(ex?.notes ?? "");
  }, [dayQ.data?.existing]);

  const actualNum = Number(actual) || 0;
  const variance = actualNum - totals.expected_cash;

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      recon_date: date,
      total_production_value: totals.total_production_value,
      total_cash_collected: totals.total_cash_collected,
      total_credit_issued: totals.total_credit_issued,
      total_expenses: totals.total_expenses,
      total_discounts: totals.total_discounts,
      expected_cash: totals.expected_cash,
      actual_cash_at_hand: actualNum,
      variance,
      notes: notes || null,
      logged_by: userData.user?.id ?? null,
    };
    const existing = dayQ.data?.existing;
    const { error } = existing
      ? await supabase.from("cash_reconciliation").update(payload).eq("id", existing.id)
      : await supabase.from("cash_reconciliation").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    try {
      if (existing) {
        await writeAuditLog({ table_name: "cash_reconciliation", record_id: existing.id, action: "UPDATE", old_values: existing, new_values: payload });
      } else {
        await writeAuditLog({ table_name: "cash_reconciliation", action: "INSERT", new_values: payload });
      }
    } catch { /* silent */ }
    toast.success(existing ? "Reconciliation updated" : "Reconciliation saved");
    qc.invalidateQueries({ queryKey: ["recon-day", date] });
    qc.invalidateQueries({ queryKey: ["recon-history"] });
  };

  const row = (label: string, val: number, muted = false) => (
    <div className="flex justify-between py-1.5 text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className="font-medium">{formatNaira(val)}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Cash reconciliation
        </h1>
        <p className="text-sm text-muted-foreground">Compare expected vs actual cash and record variance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">Reconcile day</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              {row("Production value (gross sales)", totals.total_production_value, true)}
              {row("Discounts", totals.total_discounts, true)}
              {row("Credit issued", totals.total_credit_issued, true)}
              <div className="my-2 border-t border-border" />
              {row("Cash collected", totals.total_cash_collected)}
              {row("− Expenses", totals.total_expenses)}
              <div className="my-2 border-t border-border" />
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Expected cash at hand</span>
                <span className="font-semibold">{formatNaira(totals.expected_cash)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Actual cash counted (₦)</Label>
              <Input type="number" step="0.01" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>

            <div className={`rounded-lg border p-4 ${Math.abs(variance) > 0.01 ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {Math.abs(variance) > 0.01 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  Variance
                </span>
                <span className={`font-semibold ${variance < 0 ? "text-destructive" : variance > 0 ? "text-emerald-600" : ""}`}>
                  {variance > 0 ? "+" : ""}{formatNaira(variance)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : dayQ.data?.existing ? "Update reconciliation" : "Save reconciliation"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent reconciliations</CardTitle></CardHeader>
          <CardContent className="p-0">
            {historyQ.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : (historyQ.data ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No reconciliations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Expected</th>
                      <th className="px-4 py-3 text-right">Actual</th>
                      <th className="px-4 py-3 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyQ.data!.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.recon_date}</td>
                        <td className="px-4 py-3 text-right">{formatNaira(r.expected_cash)}</td>
                        <td className="px-4 py-3 text-right">{formatNaira(r.actual_cash_at_hand)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${Number(r.variance) < 0 ? "text-destructive" : Number(r.variance) > 0 ? "text-emerald-600" : ""}`}>
                          {Number(r.variance) > 0 ? "+" : ""}{formatNaira(r.variance)}
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
