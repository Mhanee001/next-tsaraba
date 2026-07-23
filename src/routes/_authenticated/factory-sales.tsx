import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Factory } from "lucide-react";
import { formatNaira, formatInt, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/factory-sales")({
  head: () => ({
    meta: [
      { title: "Factory Sales — Next Tsaraba" },
      { name: "description", content: "Record factory sales with product breakdown, returns, and deductions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FactorySalesPage,
});

function FactorySalesPage() {
  const qc = useQueryClient();
  const today = todayISO();
  const [saleDate, setSaleDate] = useState(today);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const productsQ = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_types").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const salesQ = useQuery({
    queryKey: ["factory-sales", saleDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_sales")
        .select("*")
        .eq("sale_date", saleDate)
        .order("product", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FactorySale[];
    },
  });

  const sales = salesQ.data ?? [];

  const qty = Number(form.quantity) || 0;
  const price = Number(form.price_per_loaf) || 0;
  const amount = qty * price;
  const dmgQty = Number(form.damage_qty) || 0;
  const dmgAmt = dmgQty * price;
  const retQty = Number(form.return_qty) || 0;
  const retAmt = retQty * price;
  const netQty = Math.max(0, qty - dmgQty - retQty);
  const netAmt = Math.max(0, amount - dmgAmt - retAmt);
  const fuel = Number(form.fuel_cost) || 0;
  const commission = Number(form.commission_cost) || 0;
  const salary = Number(form.salary_cost) || 0;
  const totalDeductions = fuel + commission + salary;
  const finalAmount = netAmt - totalDeductions;

  const totals = {
    quantity: sales.reduce((s, r) => s + r.quantity, 0),
    amount: sales.reduce((s, r) => s + Number(r.amount), 0),
    damage_qty: sales.reduce((s, r) => s + r.damage_qty, 0),
    damage_amount: sales.reduce((s, r) => s + Number(r.damage_amount), 0),
    return_qty: sales.reduce((s, r) => s + r.return_qty, 0),
    return_amount: sales.reduce((s, r) => s + Number(r.return_amount), 0),
    net_quantity: sales.reduce((s, r) => s + r.net_quantity, 0),
    net_amount: sales.reduce((s, r) => s + Number(r.net_amount), 0),
    fuel_cost: sales.reduce((s, r) => s + Number(r.fuel_cost), 0),
    commission_cost: sales.reduce((s, r) => s + Number(r.commission_cost), 0),
    salary_cost: sales.reduce((s, r) => s + Number(r.salary_cost), 0),
  };
  const grandFinal = totals.net_amount - totals.fuel_cost - totals.commission_cost - totals.salary_cost;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 || price <= 0) return toast.error("Quantity and price per loaf are required");

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      sale_date: saleDate,
      product: form.product,
      price_per_loaf: price,
      quantity: qty,
      amount,
      damage_qty: dmgQty,
      damage_amount: dmgAmt,
      return_qty: retQty,
      return_amount: retAmt,
      net_quantity: netQty,
      net_amount: netAmt,
      fuel_cost: fuel,
      commission_cost: commission,
      salary_cost: salary,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    };

    const { error } = await supabase.from("factory_sales").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);

    try { await writeAuditLog({ table_name: "factory_sales", action: "INSERT", new_values: payload }); } catch { /* silent */ }
    toast.success("Factory sale recorded");
    setForm(emptyForm());
    qc.invalidateQueries({ queryKey: ["factory-sales", saleDate] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("factory_sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "factory_sales", record_id: id, action: "DELETE" }); } catch { /* silent */ }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["factory-sales", saleDate] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Factory className="h-6 w-6" /> Factory Sales
        </h1>
        <p className="text-sm text-muted-foreground">
          Record product-level factory sales with damages, returns, and daily deductions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Product</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                >
                  <option value="">Select product</option>
                  {productsQ.data?.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Qty (loaves)</Label>
                  <Input type="number" min="0" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Price / loaf (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.price_per_loaf}
                    onChange={(e) => setForm({ ...form, price_per_loaf: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Damages (qty)</Label>
                  <Input type="number" min="0" value={form.damage_qty}
                    onChange={(e) => setForm({ ...form, damage_qty: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Returns (qty)</Label>
                  <Input type="number" min="0" value={form.return_qty}
                    onChange={(e) => setForm({ ...form, return_qty: e.target.value })} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross</span>
                  <span>{formatNaira(amount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Damages</span>
                  <span>-{formatNaira(dmgAmt)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Returns</span>
                  <span>-{formatNaira(retAmt)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Net</span>
                  <span>{formatNaira(netAmt)}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deductions</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fuel (₦)</Label>
                    <Input type="number" step="0.01" min="0" value={form.fuel_cost}
                      onChange={(e) => setForm({ ...form, fuel_cost: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Commission (₦)</Label>
                    <Input type="number" step="0.01" min="0" value={form.commission_cost}
                      onChange={(e) => setForm({ ...form, commission_cost: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Salary (₦)</Label>
                    <Input type="number" step="0.01" min="0" value={form.salary_cost}
                      onChange={(e) => setForm({ ...form, salary_cost: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-primary/10 p-3 text-sm font-semibold flex justify-between">
                <span>Final amount</span>
                <span>{formatNaira(finalAmount)}</span>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Record sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales for {saleDate}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {salesQ.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : sales.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No factory sales for this date.</p>
            ) : (
              <ScrollArea>
                <div className="min-w-[800px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3 text-right">Qty</th>
                        <th className="px-3 py-3 text-right">Gross</th>
                        <th className="px-3 py-3 text-right">Damage</th>
                        <th className="px-3 py-3 text-right">Return</th>
                        <th className="px-3 py-3 text-right">Net Qty</th>
                        <th className="px-3 py-3 text-right">Net Amt</th>
                        <th className="px-3 py-3 text-right">Deductions</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sales.map((r) => {
                        const ded = Number(r.fuel_cost) + Number(r.commission_cost) + Number(r.salary_cost);
                        return (
                          <tr key={r.id}>
                            <td className="px-3 py-3 font-medium">{r.product}</td>
                            <td className="px-3 py-3 text-right">{formatInt(r.quantity)}</td>
                            <td className="px-3 py-3 text-right">{formatNaira(r.amount)}</td>
                            <td className="px-3 py-3 text-right text-red-600">
                              {r.damage_qty > 0 ? `${r.damage_qty} / ${formatNaira(r.damage_amount)}` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-red-600">
                              {r.return_qty > 0 ? `${r.return_qty} / ${formatNaira(r.return_amount)}` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">{formatInt(r.net_quantity)}</td>
                            <td className="px-3 py-3 text-right font-semibold">{formatNaira(r.net_amount)}</td>
                            <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                              {ded > 0 ? formatNaira(ded) : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Del</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                      <tr>
                        <td className="px-3 py-3">TOTAL</td>
                        <td className="px-3 py-3 text-right">{formatInt(totals.quantity)}</td>
                        <td className="px-3 py-3 text-right">{formatNaira(totals.amount)}</td>
                        <td className="px-3 py-3 text-right text-red-600">
                          {totals.damage_qty > 0 ? `${formatInt(totals.damage_qty)} / ${formatNaira(totals.damage_amount)}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-red-600">
                          {totals.return_qty > 0 ? `${formatInt(totals.return_qty)} / ${formatNaira(totals.return_amount)}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">{formatInt(totals.net_quantity)}</td>
                        <td className="px-3 py-3 text-right">{formatNaira(totals.net_amount)}</td>
                        <td className="px-3 py-3 text-right">{formatNaira(totals.fuel_cost + totals.commission_cost + totals.salary_cost)}</td>
                        <td></td>
                      </tr>
                      <tr className="text-xs text-muted-foreground">
                        <td colSpan={7}></td>
                        <td className="px-3 py-2 text-right">Fuel: {formatNaira(totals.fuel_cost)}</td>
                        <td></td>
                      </tr>
                      <tr className="text-xs text-muted-foreground">
                        <td colSpan={7}></td>
                        <td className="px-3 py-2 text-right">Commission: {formatNaira(totals.commission_cost)}</td>
                        <td></td>
                      </tr>
                      <tr className="text-xs text-muted-foreground">
                        <td colSpan={7}></td>
                        <td className="px-3 py-2 text-right">Salary: {formatNaira(totals.salary_cost)}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t border-border">
                        <td colSpan={6}></td>
                        <td className="px-3 py-3 text-right font-bold text-lg">{formatNaira(grandFinal)}</td>
                        <td></td>
                        <td></td>
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
    </div>
  );
}

type FactorySale = {
  id: string;
  sale_date: string;
  product: string;
  price_per_loaf: number;
  quantity: number;
  amount: number;
  damage_qty: number;
  damage_amount: number;
  return_qty: number;
  return_amount: number;
  net_quantity: number;
  net_amount: number;
  fuel_cost: number;
  commission_cost: number;
  salary_cost: number;
  notes: string | null;
};

type FactorySaleForm = {
  product: string;
  quantity: string;
  price_per_loaf: string;
  damage_qty: string;
  return_qty: string;
  fuel_cost: string;
  commission_cost: string;
  salary_cost: string;
  notes: string;
};

const emptyForm = (): FactorySaleForm => ({
  product: "",
  quantity: "",
  price_per_loaf: "",
  damage_qty: "0",
  return_qty: "0",
  fuel_cost: "0",
  commission_cost: "0",
  salary_cost: "0",
  notes: "",
});
