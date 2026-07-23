import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Landmark } from "lucide-react";
import { formatNaira, formatInt, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cash-summary")({
  head: () => ({
    meta: [
      { title: "Cash Summary — Next Tsaraba" },
      { name: "description", content: "Daily cash summary aggregating production, sales, expenses, and deductions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CashSummaryPage,
});

function CashSummaryPage() {
  const today = todayISO();
  const sevenDaysAgo = (d: string) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - 6);
    return dt.toISOString().slice(0, 10);
  };
  const [from, setFrom] = useState(sevenDaysAgo(today));
  const [to, setTo] = useState(today);

  const dayQ = useQuery({
    queryKey: ["cash-summary", from, to],
    queryFn: async () => {
      const [prod, sales, expenses, factorySales, cashRecon] = await Promise.all([
        supabase.from("production_logs").select("log_date, bags_produced, carry_over_stock, damages").gte("log_date", from).lte("log_date", to),
        supabase.from("sales_records").select("sale_date, cash_collected, credit_amount, discount, commission_earned, gross_amount").gte("sale_date", from).lte("sale_date", to),
        supabase.from("expenses").select("expense_date, amount").gte("expense_date", from).lte("expense_date", to),
        supabase.from("factory_sales").select("sale_date, fuel_cost, commission_cost, salary_cost").gte("sale_date", from).lte("sale_date", to),
        supabase.from("cash_reconciliation").select("*").gte("recon_date", from).lte("recon_date", to),
      ]);
      if (prod.error) throw prod.error;
      if (sales.error) throw sales.error;
      if (expenses.error) throw expenses.error;
      if (factorySales.error) throw factorySales.error;
      if (cashRecon.error) throw cashRecon.error;
      return { prod: prod.data ?? [], sales: sales.data ?? [], expenses: expenses.data ?? [], factorySales: factorySales.data ?? [], cashRecon: cashRecon.data ?? [] };
    },
  });

  const history = (() => {
    const d = dayQ.data;
    if (!d) return [];
    const dateMap: Record<string, DaySummary> = {};

    for (const r of d.prod) {
      if (!dateMap[r.log_date]) dateMap[r.log_date] = emptyDay(r.log_date);
      dateMap[r.log_date].production += Number(r.bags_produced) || 0;
      dateMap[r.log_date].leftOver += Number(r.carry_over_stock) || 0;
      dateMap[r.log_date].damage += Number(r.damages) || 0;
    }
    for (const r of d.sales) {
      if (!dateMap[r.sale_date]) dateMap[r.sale_date] = emptyDay(r.sale_date);
      dateMap[r.sale_date].cashAtHand += Number(r.cash_collected) || 0;
      dateMap[r.sale_date].credit += Number(r.credit_amount) || 0;
      dateMap[r.sale_date].discount += Number(r.discount) || 0;
      dateMap[r.sale_date].commission += Number(r.commission_earned) || 0;
      dateMap[r.sale_date].productionVal += Number(r.gross_amount) || 0;
    }
    for (const r of d.expenses) {
      if (!dateMap[r.expense_date]) dateMap[r.expense_date] = emptyDay(r.expense_date);
      dateMap[r.expense_date].expenses += Number(r.amount) || 0;
    }
    for (const r of d.factorySales) {
      if (!dateMap[r.sale_date]) dateMap[r.sale_date] = emptyDay(r.sale_date);
      dateMap[r.sale_date].fuel += Number(r.fuel_cost) || 0;
      dateMap[r.sale_date].commission += Number(r.commission_cost) || 0;
      dateMap[r.sale_date].salaries += Number(r.salary_cost) || 0;
    }
    for (const r of d.cashRecon) {
      if (!dateMap[r.recon_date]) dateMap[r.recon_date] = emptyDay(r.recon_date);
      dateMap[r.recon_date].actualCashAtHand = Number(r.actual_cash_at_hand) || 0;
    }
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const totals = history.reduce(
    (a, r) => ({
      production: a.production + r.production,
      productionVal: a.productionVal + r.productionVal,
      leftOver: a.leftOver + r.leftOver,
      damage: a.damage + r.damage,
      commission: a.commission + r.commission,
      discount: a.discount + r.discount,
      balance: a.balance + r.balance,
      cashAtHand: a.cashAtHand + r.cashAtHand,
      actualCashAtHand: a.actualCashAtHand + r.actualCashAtHand,
      credit: a.credit + r.credit,
      expenses: a.expenses + r.expenses,
      fuel: a.fuel + r.fuel,
      salaries: a.salaries + r.salaries,
    }),
    { production: 0, productionVal: 0, leftOver: 0, damage: 0, commission: 0, discount: 0, balance: 0, cashAtHand: 0, actualCashAtHand: 0, credit: 0, expenses: 0, fuel: 0, salaries: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6" /> Cash Summary
        </h1>
        <p className="text-sm text-muted-foreground">
          Daily aggregation of production, sales, expenses, and deductions.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48 space-y-1.5">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="w-48 space-y-1.5">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="mt-6" onClick={() => { setFrom(sevenDaysAgo(today)); setTo(today); }}>
          Last 7 days
        </Button>
        <Button variant="outline" size="sm" className="mt-6" onClick={() => { setFrom(today.slice(0, 8) + "01"); setTo(today); }}>
          This month
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily cash summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dayQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : history.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No data for this period.</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[1100px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3 text-right">Production</th>
                      <th className="px-3 py-3 text-right">Left Over</th>
                      <th className="px-3 py-3 text-right">Damage</th>
                      <th className="px-3 py-3 text-right">Commission</th>
                      <th className="px-3 py-3 text-right">Discount</th>
                      <th className="px-3 py-3 text-right">Balance</th>
                      <th className="px-3 py-3 text-right">Cash at Hand</th>
                      <th className="px-3 py-3 text-right">Actual Cash</th>
                      <th className="px-3 py-3 text-right">Credit</th>
                      <th className="px-3 py-3 text-right">Expenses</th>
                      <th className="px-3 py-3 text-right">Fuel</th>
                      <th className="px-3 py-3 text-right">Salaries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((r) => (
                      <tr key={r.date}>
                        <td className="px-3 py-2.5 font-medium">{r.date}</td>
                        <td className="px-3 py-2.5 text-right">{r.production > 0 ? formatInt(r.production) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.leftOver > 0 ? formatInt(r.leftOver) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.damage > 0 ? formatInt(r.damage) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.commission > 0 ? formatNaira(r.commission) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.discount > 0 ? formatNaira(r.discount) : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">
                          {r.productionVal > 0 ? formatNaira(r.productionVal) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right">{r.cashAtHand > 0 ? formatNaira(r.cashAtHand) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.actualCashAtHand > 0 ? formatNaira(r.actualCashAtHand) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.credit > 0 ? formatNaira(r.credit) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.expenses > 0 ? formatNaira(r.expenses) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.fuel > 0 ? formatNaira(r.fuel) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{r.salaries > 0 ? formatNaira(r.salaries) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                    <tr>
                      <td className="px-3 py-2.5">TOTAL ({history.length} days)</td>
                      <td className="px-3 py-2.5 text-right">{formatInt(totals.production)}</td>
                      <td className="px-3 py-2.5 text-right">{formatInt(totals.leftOver)}</td>
                      <td className="px-3 py-2.5 text-right">{formatInt(totals.damage)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.commission)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.discount)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.productionVal)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.cashAtHand)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.actualCashAtHand)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.credit)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.expenses)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.fuel)}</td>
                      <td className="px-3 py-2.5 text-right">{formatNaira(totals.salaries)}</td>
                    </tr>
                  </tfoot>
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

type DaySummary = {
  date: string;
  production: number;
  productionVal: number;
  leftOver: number;
  damage: number;
  commission: number;
  discount: number;
  balance: number;
  cashAtHand: number;
  actualCashAtHand: number;
  credit: number;
  expenses: number;
  fuel: number;
  salaries: number;
};

const emptyDay = (date: string): DaySummary => ({
  date,
  production: 0,
  productionVal: 0,
  leftOver: 0,
  damage: 0,
  commission: 0,
  discount: 0,
  balance: 0,
  cashAtHand: 0,
  actualCashAtHand: 0,
  credit: 0,
  expenses: 0,
  fuel: 0,
  salaries: 0,
});
