import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, TrendingDown, DollarSign, Factory, Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { formatNaira, formatInt, formatNum, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/managing-director")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — Next Tsaraba" },
      { name: "description", content: "High-level overview for the Managing Director." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagingDirectorPage,
});

function StatCard({ label, value, icon: Icon, sub, trend }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; sub?: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${trend === "up" ? "bg-emerald-100 text-emerald-700" : trend === "down" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ManagingDirectorPage() {
  const today = todayISO();
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().slice(0, 10);

  const monthQ = useQuery({
    queryKey: ["md-month", from],
    queryFn: async () => {
      const [sales, expenses, production, materials, cashflow, agents, proforma] = await Promise.all([
        supabase.from("sales_records").select("sale_date, gross_amount, cash_collected, credit_amount, commission_earned, quantity").gte("sale_date", from),
        supabase.from("expenses").select("expense_date, amount").gte("expense_date", from),
        supabase.from("production_logs").select("log_date, bags_produced, damages").gte("log_date", from),
        supabase.from("raw_materials").select("quantity_in_stock, low_stock_threshold, name, unit"),
        supabase.from("cash_flow_entries").select("type, amount").gte("entry_date", from),
        supabase.from("agents").select("credit_balance"),
        supabase.from("proforma_orders").select("status, total_amount"),
      ]);
      if (sales.error) throw sales.error;
      if (expenses.error) throw expenses.error;
      if (production.error) throw production.error;
      return { sales: sales.data ?? [], expenses: expenses.data ?? [], production: production.data ?? [], materials: materials.data ?? [], cashflow: cashflow.data ?? [], agents: agents.data ?? [], proforma: proforma.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const d = monthQ.data;
    if (!d) return null;
    const revenue = d.sales.reduce((s: number, r: any) => s + Number(r.gross_amount), 0);
    const cash = d.sales.reduce((s: number, r: any) => s + Number(r.cash_collected), 0);
    const credit = d.sales.reduce((s: number, r: any) => s + Number(r.credit_amount), 0);
    const commission = d.sales.reduce((s: number, r: any) => s + Number(r.commission_earned), 0);
    const bagsSold = d.sales.reduce((s: number, r: any) => s + Number(r.quantity), 0);
    const expenseTotal = d.expenses.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const bagsProduced = d.production.reduce((s: number, r: any) => s + Number(r.bags_produced), 0);
    const damages = d.production.reduce((s: number, r: any) => s + Number(r.damages), 0);
    const profit = revenue - expenseTotal - commission;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const lowStock = d.materials.filter((m: any) => Number(m.quantity_in_stock) <= Number(m.low_stock_threshold));
    const totalCredit = d.agents.reduce((s: number, r: any) => s + Number(r.credit_balance), 0);
    const pendingOrders = d.proforma.filter((r: any) => r.status === "pending").reduce((s: number, r: any) => s + Number(r.total_amount), 0);
    return { revenue, cash, credit, commission, bagsSold, expenseTotal, bagsProduced, damages, profit, margin, lowStock: lowStock.length, totalCredit, pendingOrders };
  }, [monthQ.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Crown className="h-6 w-6" /> Executive Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Month-to-date overview for the Managing Director.</p>
      </div>

      {monthQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !stats ? (
        <p className="text-sm text-muted-foreground">No data available.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Month Revenue" value={formatNaira(stats.revenue)} icon={TrendingUp} sub={`${formatInt(stats.bagsSold)} bags sold`} trend="up" />
            <StatCard label="Cash Collected" value={formatNaira(stats.cash)} icon={DollarSign} sub={`${formatNaira(stats.credit)} on credit`} trend={stats.cash > stats.credit ? "up" : "down"} />
            <StatCard label="Expenses" value={formatNaira(stats.expenseTotal)} icon={TrendingDown} sub={`${formatNaira(stats.commission)} commissions`} trend="down" />
            <StatCard label="Net Profit" value={formatNaira(stats.profit)} icon={DollarSign} sub={`${formatNum(stats.margin, 1)}% margin`} trend={stats.profit >= 0 ? "up" : "down"} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Bags Produced" value={formatInt(stats.bagsProduced)} icon={Factory} sub={`${formatInt(stats.damages)} damaged`} />
            <StatCard label="Bags Sold" value={formatInt(stats.bagsSold)} icon={ShoppingCart} sub={stats.bagsProduced > 0 ? `${Math.round((stats.bagsSold / stats.bagsProduced) * 100)}% sell-through` : "—"} />
            <StatCard label="Outstanding Credit" value={formatNaira(stats.totalCredit)} icon={Users} trend={stats.totalCredit > 0 ? "down" : "up"} />
            <StatCard label="Low Stock Items" value={String(stats.lowStock)} icon={Package} sub={stats.lowStock > 0 ? "Needs attention" : "All good"} trend={stats.lowStock > 0 ? "down" : "up"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Alerts &amp; Actions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {stats.lowStock > 0 && (
                    <li className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                      <span>{stats.lowStock} material(s) running low</span>
                      <Button asChild size="sm" variant="outline"><Link to="/materials">View</Link></Button>
                    </li>
                  )}
                  {stats.totalCredit > 10000 && (
                    <li className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                      <span>High outstanding credit: {formatNaira(stats.totalCredit)}</span>
                      <Button asChild size="sm" variant="outline"><Link to="/agents">View agents</Link></Button>
                    </li>
                  )}
                  {stats.pendingOrders > 0 && (
                    <li className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                      <span>Pending orders worth {formatNaira(stats.pendingOrders)}</span>
                      <Button asChild size="sm" variant="outline"><Link to="/pro-form">View orders</Link></Button>
                    </li>
                  )}
                  {stats.lowStock === 0 && stats.totalCredit <= 10000 && stats.pendingOrders === 0 && (
                    <li className="text-sm text-muted-foreground">No outstanding alerts.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Quick links</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="justify-start"><Link to="/sales"><ShoppingCart className="mr-2 h-4 w-4" /> New sale</Link></Button>
                  <Button asChild variant="outline" className="justify-start"><Link to="/production"><Factory className="mr-2 h-4 w-4" /> Log production</Link></Button>
                  <Button asChild variant="outline" className="justify-start"><Link to="/reconciliation"><DollarSign className="mr-2 h-4 w-4" /> Cash recon</Link></Button>
                  <Button asChild variant="outline" className="justify-start"><Link to="/cash-flow"><TrendingUp className="mr-2 h-4 w-4" /> Cash flow</Link></Button>
                  <Button asChild variant="outline" className="justify-start"><Link to="/reports"><TrendingDown className="mr-2 h-4 w-4" /> Reports</Link></Button>
                  <Button asChild variant="outline" className="justify-start"><Link to="/pro-form"><Package className="mr-2 h-4 w-4" /> Pro-forma</Link></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
