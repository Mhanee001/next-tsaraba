import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { formatNaira, formatInt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Next Tsaraba" },
      { name: "description", content: "Weekly and monthly reports: profit, top agents, production trends." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

type Range = "7d" | "30d" | "90d";

function startDate(range: Range): string {
  const d = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function ReportsPage() {
  const [range, setRange] = useState<Range>("30d");
  const from = startDate(range);

  const q = useQuery({
    queryKey: ["reports", range],
    queryFn: async () => {
      const [sales, expenses, production] = await Promise.all([
        supabase.from("sales_records").select("sale_date, gross_amount, cash_collected, credit_amount, commission_earned, quantity, agent_id, agents(name)").gte("sale_date", from),
        supabase.from("expenses").select("expense_date, amount, category").gte("expense_date", from),
        supabase.from("production_logs").select("log_date, bags_produced, damages").gte("log_date", from),
      ]);
      if (sales.error) throw sales.error;
      if (expenses.error) throw expenses.error;
      if (production.error) throw production.error;
      return { sales: sales.data ?? [], expenses: expenses.data ?? [], production: production.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const s = q.data?.sales ?? [];
    const e = q.data?.expenses ?? [];
    const p = q.data?.production ?? [];
    const revenue = s.reduce((a: number, r: any) => a + Number(r.gross_amount), 0);
    const cash = s.reduce((a: number, r: any) => a + Number(r.cash_collected), 0);
    const credit = s.reduce((a: number, r: any) => a + Number(r.credit_amount), 0);
    const commission = s.reduce((a: number, r: any) => a + Number(r.commission_earned), 0);
    const bagsSold = s.reduce((a: number, r: any) => a + Number(r.quantity), 0);
    const expenseTotal = e.reduce((a: number, r: any) => a + Number(r.amount), 0);
    const bagsProduced = p.reduce((a: number, r: any) => a + Number(r.bags_produced), 0);
    const damages = p.reduce((a: number, r: any) => a + Number(r.damages), 0);
    const profit = revenue - expenseTotal - commission;

    const byAgent: Record<string, { name: string; qty: number; revenue: number }> = {};
    s.forEach((r: any) => {
      if (!r.agent_id) return;
      const name = r.agents?.name ?? "Unknown";
      const cur = byAgent[r.agent_id] ?? { name, qty: 0, revenue: 0 };
      cur.qty += Number(r.quantity);
      cur.revenue += Number(r.gross_amount);
      byAgent[r.agent_id] = cur;
    });
    const topAgents = Object.values(byAgent).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const byCat: Record<string, number> = {};
    e.forEach((r: any) => { byCat[r.category] = (byCat[r.category] ?? 0) + Number(r.amount); });
    const expenseBreakdown = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    return { revenue, cash, credit, commission, bagsSold, expenseTotal, bagsProduced, damages, profit, topAgents, expenseBreakdown };
  }, [q.data]);

  const kpi = (label: string, value: string, sub?: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground">Since {from}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["7d", "30d", "90d"] as Range[]).map((r) => (
            <Button key={r} size="sm" variant={range === r ? "default" : "ghost"} onClick={() => setRange(r)}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </Button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpi("Revenue", formatNaira(stats.revenue), `${formatInt(stats.bagsSold)} bags sold`)}
            {kpi("Cash collected", formatNaira(stats.cash), `${formatNaira(stats.credit)} credit issued`)}
            {kpi("Expenses", formatNaira(stats.expenseTotal), `${formatNaira(stats.commission)} in commissions`)}
            {kpi("Net profit", formatNaira(stats.profit), stats.profit >= 0 ? "Revenue − expenses − commissions" : "Loss")}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {kpi("Bags produced", formatInt(stats.bagsProduced), `${formatInt(stats.damages)} damaged`)}
            {kpi("Sell-through", stats.bagsProduced > 0 ? `${Math.round((stats.bagsSold / stats.bagsProduced) * 100)}%` : "—", "Bags sold ÷ produced")}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top agents</CardTitle></CardHeader>
              <CardContent className="p-0">
                {stats.topAgents.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No agent sales in this period.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3 text-right">Bags</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.topAgents.map((a, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-medium">{a.name}</td>
                          <td className="px-4 py-3 text-right">{formatInt(a.qty)}</td>
                          <td className="px-4 py-3 text-right">{formatNaira(a.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Expenses by category</CardTitle></CardHeader>
              <CardContent className="p-0">
                {stats.expenseBreakdown.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No expenses in this period.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.expenseBreakdown.map(([cat, amt]) => (
                        <tr key={cat}>
                          <td className="px-4 py-3">{cat}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatNaira(amt)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {stats.expenseTotal > 0 ? `${Math.round((amt / stats.expenseTotal) * 100)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
