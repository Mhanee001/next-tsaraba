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

export const Route = createFileRoute("/_authenticated/cash-flow-by-person")({
  head: () => ({
    meta: [
      { title: "Cash Flow by Person — Next Tsaraba" },
      { name: "description", content: "Daily cash collections grouped by agent, customer and factory sales." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CashFlowByPersonPage,
});

function CashFlowByPersonPage() {
  const today = todayISO();
  const thirtyDaysAgo = (d: string) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - 29);
    return dt.toISOString().slice(0, 10);
  };
  const [from, setFrom] = useState(thirtyDaysAgo(today));
  const [to, setTo] = useState(today);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const dayQ = useQuery({
    queryKey: ["cashflow-by-person", from, to],
    queryFn: async () => {
      const [sales, factorySales] = await Promise.all([
        supabase.from("sales_records").select("sale_date, agent_id, cash_collected, gross_amount").gte("sale_date", from).lte("sale_date", to),
        supabase.from("factory_sales").select("sale_date, customer_id, net_amount, fuel_cost, commission_cost, salary_cost").gte("sale_date", from).lte("sale_date", to),
      ]);
      if (sales.error) throw sales.error;
      if (factorySales.error) throw factorySales.error;
      return { sales: sales.data ?? [], factorySales: factorySales.data ?? [] };
    },
  });

  const sources = [
    { id: "factory", label: "FACTORY SALES", type: "factory" as const },
    ...agents.map((a) => ({ id: a.id, label: a.name.toUpperCase(), type: "agent" as const })),
    ...customers.map((c) => ({ id: c.id, label: c.name.toUpperCase(), type: "customer" as const })),
  ];

  const dateRange: string[] = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    dateRange.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }

  const matrix: Record<string, Record<string, number>> = {};
  for (const date of dateRange) matrix[date] = {};

  for (const r of dayQ.data?.sales ?? []) {
    const key = r.agent_id || "walk-in";
    if (!matrix[r.sale_date]) matrix[r.sale_date] = {};
    matrix[r.sale_date][key] = (matrix[r.sale_date][key] || 0) + Number(r.cash_collected);
  }
  for (const r of dayQ.data?.factorySales ?? []) {
    const key = r.customer_id || "factory";
    if (!matrix[r.sale_date]) matrix[r.sale_date] = {};
    const collected = Number(r.net_amount) - Number(r.fuel_cost) - Number(r.commission_cost) - Number(r.salary_cost);
    matrix[r.sale_date][key] = (matrix[r.sale_date][key] || 0) + Math.max(0, collected);
  }

  const totals: Record<string, number> = {};
  const rowTotals: Record<string, number> = {};
  for (const date of dateRange) {
    let rowTotal = 0;
    for (const src of sources) {
      const val = matrix[date]?.[src.id] || 0;
      rowTotal += val;
      totals[src.id] = (totals[src.id] || 0) + val;
    }
    rowTotals[date] = rowTotal;
  }
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6" /> Cash Flow by Person
        </h1>
        <p className="text-sm text-muted-foreground">
          Daily cash collections grouped by agent, customer, and factory sales.
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
        <Button variant="outline" size="sm" className="mt-6" onClick={() => { setFrom(thirtyDaysAgo(today)); setTo(today); }}>
          Last 30 days
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash collected by source</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dayQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : dateRange.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No data for this period.</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[600px]" style={{ width: `${Math.max(600, sources.length * 130 + 120)}px` }}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 sticky left-0 bg-muted/50 z-10">Date</th>
                      {sources.map((src) => (
                        <th key={src.id} className="px-2 py-3 text-right max-w-[120px] truncate" title={src.label}>
                          {src.label}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dateRange.map((date) => (
                      <tr key={date}>
                        <td className="px-3 py-2 sticky left-0 bg-background z-10 font-medium">{date}</td>
                        {sources.map((src) => (
                          <td key={src.id} className="px-2 py-2 text-right text-xs">
                            {matrix[date]?.[src.id] ? formatNaira(matrix[date][src.id]) : "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold">{formatNaira(rowTotals[date])}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                    <tr>
                      <td className="px-3 py-2.5 sticky left-0 bg-muted/30 z-10">TOTAL</td>
                      {sources.map((src) => (
                        <td key={src.id} className="px-2 py-2.5 text-right text-xs">
                          {totals[src.id] ? formatNaira(totals[src.id]) : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">{formatNaira(grandTotal)}</td>
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
