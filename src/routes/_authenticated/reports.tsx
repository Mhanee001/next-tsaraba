import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Factory } from "lucide-react";
import { formatNaira, formatInt, formatNum } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Next Tsaraba" },
      { name: "description", content: "Weekly and monthly reports with charts: profit, top agents, production trends." },
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

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function ReportsPage() {
  const [range, setRange] = useState<Range>("30d");
  const from = startDate(range);

  const q = useQuery({
    queryKey: ["reports", range],
    queryFn: async () => {
      const [sales, expenses, production, cashflow] = await Promise.all([
        supabase.from("sales_records").select("sale_date, gross_amount, cash_collected, credit_amount, commission_earned, quantity, agent_id, agents(name)").gte("sale_date", from),
        supabase.from("expenses").select("expense_date, amount, category").gte("expense_date", from),
        supabase.from("production_logs").select("log_date, bags_produced, damages").gte("log_date", from),
        supabase.from("cash_flow_entries").select("entry_date, type, amount").gte("entry_date", from),
      ]);
      if (sales.error) throw sales.error;
      if (expenses.error) throw expenses.error;
      if (production.error) throw production.error;
      return { sales: sales.data ?? [], expenses: expenses.data ?? [], production: production.data ?? [], cashflow: cashflow.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const s = q.data?.sales ?? [];
    const e = q.data?.expenses ?? [];
    const p = q.data?.production ?? [];
    const cf = q.data?.cashflow ?? [];
    const revenue = s.reduce((a: number, r: any) => a + Number(r.gross_amount), 0);
    const cash = s.reduce((a: number, r: any) => a + Number(r.cash_collected), 0);
    const credit = s.reduce((a: number, r: any) => a + Number(r.credit_amount), 0);
    const commission = s.reduce((a: number, r: any) => a + Number(r.commission_earned), 0);
    const bagsSold = s.reduce((a: number, r: any) => a + Number(r.quantity), 0);
    const expenseTotal = e.reduce((a: number, r: any) => a + Number(r.amount), 0);
    const bagsProduced = p.reduce((a: number, r: any) => a + Number(r.bags_produced), 0);
    const damages = p.reduce((a: number, r: any) => a + Number(r.damages), 0);
    const profit = revenue - expenseTotal - commission;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const cfInflow = cf.filter((r: any) => r.type === "inflow").reduce((a: number, r: any) => a + Number(r.amount), 0);
    const cfOutflow = cf.filter((r: any) => r.type === "outflow").reduce((a: number, r: any) => a + Number(r.amount), 0);

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

    const dailyRev: Record<string, number> = {};
    s.forEach((r: any) => { dailyRev[r.sale_date] = (dailyRev[r.sale_date] ?? 0) + Number(r.gross_amount); });
    const revenueTrend = Object.entries(dailyRev).sort(([a], [b]) => a.localeCompare(b)).map(([date, amt]) => ({ date, amount: amt }));

    const dailyProd: Record<string, number> = {};
    p.forEach((r: any) => { dailyProd[r.log_date] = (dailyProd[r.log_date] ?? 0) + Number(r.bags_produced); });
    const prodTrend = Object.entries(dailyProd).sort(([a], [b]) => a.localeCompare(b)).map(([date, bags]) => ({ date, bags }));

    return { revenue, cash, credit, commission, bagsSold, expenseTotal, bagsProduced, damages, profit, margin, cfInflow, cfOutflow, topAgents, expenseBreakdown, revenueTrend, prodTrend };
  }, [q.data]);

  const kpi = (label: string, value: string, sub?: string) => (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
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
            {kpi("Net profit", formatNaira(stats.profit), `${formatNum(stats.margin, 1)}% margin`)}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue trend</CardTitle></CardHeader>
              <CardContent>
                {stats.revenueTrend.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${formatNum(v / 1000, 0)}k`} />
                      <Tooltip formatter={(v: number) => formatNaira(v)} />
                      <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Factory className="h-4 w-4" /> Production trend</CardTitle></CardHeader>
              <CardContent>
                {stats.prodTrend.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.prodTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="bags" fill="#10b981" radius={[4, 4, 0, 0]} name="Bags" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top agents</CardTitle></CardHeader>
              <CardContent className="p-0">
                {stats.topAgents.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No agent sales in this period.</p>
                ) : (
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.topAgents} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${formatNum(v / 1000, 0)}k`} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                        <Tooltip formatter={(v: number) => formatNaira(v)} />
                        <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Expenses by category</CardTitle></CardHeader>
              <CardContent>
                {stats.expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses in this period.</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={220}>
                      <PieChart>
                        <Pie data={stats.expenseBreakdown.map(([cat, amt]) => ({ name: cat, value: amt }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${formatNum(percent * 100, 0)}%`}>
                          {stats.expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatNaira(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 text-sm">
                      {stats.expenseBreakdown.map(([cat, amt], i) => (
                        <div key={cat} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground">{cat}</span>
                          <span className="font-medium">{formatNaira(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
