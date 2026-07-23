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
import { formatNaira, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "Sales — Next Tsaraba" },
      { name: "description", content: "Record daily sales for agents, factory and walk-in customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalesPage,
});

type SaleType = "agent" | "factory" | "sales_point";

function SalesPage() {
  const qc = useQueryClient();
  const today = todayISO();

  const [form, setForm] = useState({
    sale_date: today,
    sale_type: "agent" as SaleType,
    agent_id: "" as string,
    quantity: "",
    unit_price: "",
    cash_collected: "",
    discount: "0",
    damages: "0",
    returns: "0",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const agentsQ = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name, commission_rate, credit_balance").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const todaySales = useQuery({
    queryKey: ["sales-today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_records")
        .select("*, agents(name)")
        .eq("sale_date", today)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const qty = Number(form.quantity) || 0;
  const price = Number(form.unit_price) || 0;
  const discount = Number(form.discount) || 0;
  const cash = Number(form.cash_collected) || 0;
  const gross = qty * price - discount;
  const credit = Math.max(0, gross - cash);

  const selectedAgent = useMemo(
    () => agentsQ.data?.find((a) => a.id === form.agent_id),
    [agentsQ.data, form.agent_id],
  );
  const commission = form.sale_type === "agent" && selectedAgent
    ? qty * Number(selectedAgent.commission_rate ?? 0)
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 || price <= 0) return toast.error("Quantity and unit price are required");
    if (form.sale_type === "agent" && !form.agent_id) return toast.error("Pick an agent");

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("sales_records").insert({
      sale_date: form.sale_date,
      sale_type: form.sale_type,
      agent_id: form.sale_type === "agent" ? form.agent_id : null,
      quantity: qty,
      unit_price: price,
      gross_amount: gross,
      cash_collected: cash,
      credit_amount: credit,
      discount,
      damages: Number(form.damages) || 0,
      returns: Number(form.returns) || 0,
      commission_earned: commission,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    });

    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    try { await writeAuditLog({ table_name: "sales_records", action: "INSERT", new_values: { sale_date: form.sale_date, sale_type: form.sale_type, agent_id: form.sale_type === "agent" ? form.agent_id : null, quantity: qty, unit_price: price, gross_amount: gross, cash_collected: cash, credit_amount: credit, discount, damages: Number(form.damages) || 0, returns: Number(form.returns) || 0, commission_earned: commission, notes: form.notes || null, logged_by: userData.user?.id ?? null } }); } catch { /* silent */ }

    // Update agent credit if credit was issued
    if (form.sale_type === "agent" && form.agent_id && credit > 0 && selectedAgent) {
      const newBal = Number(selectedAgent.credit_balance) + credit;
      const { error: uErr } = await supabase
        .from("agents")
        .update({ credit_balance: newBal })
        .eq("id", form.agent_id);
      if (uErr) toast.error("Sale saved but credit balance update failed: " + uErr.message);
    }

    setSaving(false);
    toast.success("Sale recorded");
    setForm({
      ...form,
      quantity: "",
      unit_price: "",
      cash_collected: "",
      discount: "0",
      damages: "0",
      returns: "0",
      notes: "",
    });
    qc.invalidateQueries({ queryKey: ["sales-today"] });
    qc.invalidateQueries({ queryKey: ["agents"] });
    qc.invalidateQueries({ queryKey: ["dash-sales"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground">Fast entry for agent, factory and walk-in sales.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.sale_date}
                    onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={form.sale_type}
                    onValueChange={(v) => setForm({ ...form, sale_type: v as SaleType, agent_id: v === "agent" ? form.agent_id : "" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="factory">Factory</SelectItem>
                      <SelectItem value="sales_point">Walk-in / sales point</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.sale_type === "agent" && (
                <div className="space-y-1.5">
                  <Label>Agent</Label>
                  <Select value={form.agent_id} onValueChange={(v) => setForm({ ...form, agent_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={agentsQ.data?.length ? "Select agent" : "No agents yet — add one first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {agentsQ.data?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} {Number(a.credit_balance) > 0 && `· ${formatNaira(a.credit_balance)} owed`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity (bags)</Label>
                  <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit price (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cash collected (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.cash_collected} onChange={(e) => setForm({ ...form, cash_collected: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Damages (bags)</Label>
                  <Input type="number" min="0" value={form.damages} onChange={(e) => setForm({ ...form, damages: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Returns (bags)</Label>
                  <Input type="number" min="0" value={form.returns} onChange={(e) => setForm({ ...form, returns: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span className="font-semibold">{formatNaira(gross)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credit issued</span><span className="font-semibold">{formatNaira(credit)}</span></div>
                {form.sale_type === "agent" && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="font-semibold">{formatNaira(commission)}</span></div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Record sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todaySales.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : (todaySales.data ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No sales recorded yet today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Cash</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todaySales.data!.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 capitalize">{r.sale_type.replace("_", " ")}</td>
                        <td className="px-4 py-3">{r.agents?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right">{r.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatNaira(r.gross_amount)}</td>
                        <td className="px-4 py-3 text-right">{formatNaira(r.cash_collected)}</td>
                        <td className="px-4 py-3 text-right">{formatNaira(r.credit_amount)}</td>
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
