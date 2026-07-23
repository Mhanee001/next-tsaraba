import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatNaira, formatInt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer ledger — Next Tsaraba" },
      { name: "description", content: "Sales history for this customer." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = useParams({ from: "/_authenticated/customers/$id" });

  const customerQ = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["customer-sales", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_sales")
        .select("*")
        .eq("customer_id", id)
        .order("sale_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = sales.reduce(
    (a, r) => ({
      quantity: a.quantity + r.quantity,
      amount: a.amount + Number(r.amount),
      net_amount: a.net_amount + Number(r.net_amount),
      damage_qty: a.damage_qty + r.damage_qty,
      return_qty: a.return_qty + r.return_qty,
      fuel: a.fuel + Number(r.fuel_cost),
      commission: a.commission + Number(r.commission_cost),
      salary: a.salary + Number(r.salary_cost),
    }),
    { quantity: 0, amount: 0, net_amount: 0, damage_qty: 0, return_qty: 0, fuel: 0, commission: 0, salary: 0 },
  );
  const grandFinal = totals.net_amount - totals.fuel - totals.commission - totals.salary;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/customers">
          <ArrowLeft className="mr-2 h-4 w-4" /> All customers
        </Link>
      </Button>

      {customerQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !customerQ.data ? (
        <p className="text-sm text-muted-foreground">Customer not found.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{customerQ.data.name}</h1>
              <p className="text-sm text-muted-foreground">
                {[customerQ.data.phone, customerQ.data.location].filter(Boolean).join(" · ") || "No contact info"}
              </p>
            </div>
          </div>

          {sales.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total purchases</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNaira(totals.amount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Net amount</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNaira(totals.net_amount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total qty</p>
                  <p className="mt-1 text-2xl font-semibold">{formatInt(totals.quantity)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Final collected</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNaira(grandFinal)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Loading…</p>
              ) : sales.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No purchases yet.</p>
              ) : (
                <ScrollArea>
                  <div className="min-w-[800px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-3">Date</th>
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3 text-right">Qty</th>
                          <th className="px-3 py-3 text-right">Gross</th>
                          <th className="px-3 py-3 text-right">Damage</th>
                          <th className="px-3 py-3 text-right">Return</th>
                          <th className="px-3 py-3 text-right">Net Amt</th>
                          <th className="px-3 py-3 text-right">Deductions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sales.map((r) => {
                          const ded = Number(r.fuel_cost) + Number(r.commission_cost) + Number(r.salary_cost);
                          return (
                            <tr key={r.id}>
                              <td className="px-3 py-3">{r.sale_date}</td>
                              <td className="px-3 py-3 font-medium">{r.product}</td>
                              <td className="px-3 py-3 text-right">{formatInt(r.quantity)}</td>
                              <td className="px-3 py-3 text-right">{formatNaira(r.amount)}</td>
                              <td className="px-3 py-3 text-right text-red-600">
                                {r.damage_qty > 0 ? `${formatInt(r.damage_qty)} / ${formatNaira(r.damage_amount)}` : "—"}
                              </td>
                              <td className="px-3 py-3 text-right text-red-600">
                                {r.return_qty > 0 ? `${formatInt(r.return_qty)} / ${formatNaira(r.return_amount)}` : "—"}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold">{formatNaira(r.net_amount)}</td>
                              <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                                {ded > 0 ? formatNaira(ded) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                        <tr>
                          <td colSpan={2} className="px-3 py-3">TOTAL ({sales.length} entries)</td>
                          <td className="px-3 py-3 text-right">{formatInt(totals.quantity)}</td>
                          <td className="px-3 py-3 text-right">{formatNaira(totals.amount)}</td>
                          <td className="px-3 py-3 text-right">{totals.damage_qty > 0 ? formatInt(totals.damage_qty) : "—"}</td>
                          <td className="px-3 py-3 text-right">{totals.return_qty > 0 ? formatInt(totals.return_qty) : "—"}</td>
                          <td className="px-3 py-3 text-right">{formatNaira(totals.net_amount)}</td>
                          <td className="px-3 py-3 text-right">{formatNaira(totals.fuel + totals.commission + totals.salary)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
