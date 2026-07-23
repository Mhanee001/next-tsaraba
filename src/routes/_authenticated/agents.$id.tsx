import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/agents/$id")({
  head: () => ({
    meta: [
      { title: "Agent ledger — Next Tsaraba" },
      { name: "description", content: "Sales history, running credit balance and commissions for this agent." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentDetail,
});

function AgentDetail() {
  const { id } = useParams({ from: "/_authenticated/agents/$id" });
  const qc = useQueryClient();
  const [payment, setPayment] = useState("");
  const [saving, setSaving] = useState(false);

  const agentQ = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const salesQ = useQuery({
    queryKey: ["agent-sales", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_records")
        .select("*")
        .eq("agent_id", id)
        .order("sale_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const recordPayment = async () => {
    const amt = Number(payment);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Enter a valid amount");
    if (!agentQ.data) return;
    setSaving(true);
    const newBalance = Math.max(0, Number(agentQ.data.credit_balance) - amt);
    const oldCredit = agentQ.data.credit_balance;
    const { error } = await supabase
      .from("agents")
      .update({ credit_balance: newBalance })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "agents", record_id: id, action: "UPDATE", old_values: { credit_balance: oldCredit }, new_values: { credit_balance: newBalance } }); } catch { /* silent */ }
    toast.success("Payment recorded");
    setPayment("");
    qc.invalidateQueries({ queryKey: ["agent", id] });
    qc.invalidateQueries({ queryKey: ["agents"] });
  };

  const totals = (salesQ.data ?? []).reduce(
    (a, r) => ({
      gross: a.gross + Number(r.gross_amount ?? 0),
      commission: a.commission + Number(r.commission_earned ?? 0),
      qty: a.qty + (r.quantity ?? 0),
    }),
    { gross: 0, commission: 0, qty: 0 },
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/agents">
          <ArrowLeft className="mr-2 h-4 w-4" /> All agents
        </Link>
      </Button>

      {agentQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !agentQ.data ? (
        <p className="text-sm text-muted-foreground">Agent not found.</p>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{agentQ.data.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[agentQ.data.phone, agentQ.data.location].filter(Boolean).join(" · ") || "No contact info"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Outstanding credit</p>
                <p className="mt-1 text-2xl font-semibold">{formatNaira(agentQ.data.credit_balance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Commission rate</p>
                <p className="mt-1 text-2xl font-semibold">₦{Number(agentQ.data.commission_rate).toFixed(2)}<span className="text-sm text-muted-foreground"> / bag</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Lifetime bags</p>
                <p className="mt-1 text-2xl font-semibold">{totals.qty.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Lifetime commission</p>
                <p className="mt-1 text-2xl font-semibold">{formatNaira(totals.commission)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record credit payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>Amount received (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={recordPayment} disabled={saving}>
                {saving ? "Saving…" : "Apply payment"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {salesQ.isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Loading…</p>
              ) : (salesQ.data ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No sales recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Gross</th>
                        <th className="px-4 py-3 text-right">Cash</th>
                        <th className="px-4 py-3 text-right">Credit</th>
                        <th className="px-4 py-3 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesQ.data!.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3">{r.sale_date}</td>
                          <td className="px-4 py-3 text-right">{r.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatNaira(r.gross_amount)}</td>
                          <td className="px-4 py-3 text-right">{formatNaira(r.cash_collected)}</td>
                          <td className="px-4 py-3 text-right">{formatNaira(r.credit_amount)}</td>
                          <td className="px-4 py-3 text-right">{formatNaira(r.commission_earned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
