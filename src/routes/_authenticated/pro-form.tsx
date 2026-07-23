import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus } from "lucide-react";
import { formatNaira, formatInt, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/pro-form")({
  head: () => ({
    meta: [
      { title: "Pro-forma Orders — Next Tsaraba" },
      { name: "description", content: "Pro-forma invoices and customer orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProFormPage,
});

type ProductType = { id: string; name: string };

function ProFormPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    product_type_id: "",
    quantity: "",
    unit_price: "",
    delivery_date: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const productsQ = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_types").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as ProductType[];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["proforma-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proforma_orders").select("*, product_types(name)").order("order_date", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const qty = Number(form.quantity) || 0;
  const price = Number(form.unit_price) || 0;
  const total = qty * price;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.quantity || !form.unit_price) return toast.error("Name, quantity and price are required");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("proforma_orders").insert({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone || null,
      product_type_id: form.product_type_id || null,
      quantity: qty,
      unit_price: price,
      total_amount: total,
      delivery_date: form.delivery_date || null,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "proforma_orders", action: "INSERT", new_values: { customer_name: form.customer_name.trim(), customer_phone: form.customer_phone || null, product_type_id: form.product_type_id || null, quantity: qty, unit_price: price, total_amount: total, delivery_date: form.delivery_date || null, notes: form.notes || null, logged_by: userData.user?.id ?? null } }); } catch { /* silent */ }
    toast.success("Pro-forma order created");
    setForm({ customer_name: "", customer_phone: "", product_type_id: "", quantity: "", unit_price: "", delivery_date: "", notes: "" });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["proforma-orders"] });
  };

  const updateStatus = async (id: string, status: string) => {
    const { data: oldOrder } = await supabase.from("proforma_orders").select("*").eq("id", id).single();
    const { error } = await supabase.from("proforma_orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "proforma_orders", record_id: id, action: "UPDATE", old_values: oldOrder ?? undefined, new_values: { status } }); } catch { /* silent */ }
    toast.success(`Order ${status}`);
    qc.invalidateQueries({ queryKey: ["proforma-orders"] });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-blue-100 text-blue-800", fulfilled: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return <Badge className={map[s] ?? ""}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" /> Pro-forma Orders
          </h1>
          <p className="text-sm text-muted-foreground">Customer order requests and pro-forma invoices.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> New order</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New pro-forma order</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Customer name *</Label>
                  <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Product type</Label>
                  <Select value={form.product_type_id} onValueChange={(v) => setForm({ ...form, product_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {productsQ.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery date</Label>
                  <Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit price (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <div className="flex h-10 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-semibold">{formatNaira(total)}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create order"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">All orders</CardTitle></CardHeader>
        <CardContent className="p-0">
          {ordersQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (ordersQ.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[700px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Delivery</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ordersQ.data!.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.order_date}</td>
                        <td className="px-4 py-3 font-medium">
                          {r.customer_name}
                          {r.customer_phone && <span className="ml-2 text-xs text-muted-foreground">{r.customer_phone}</span>}
                        </td>
                        <td className="px-4 py-3">{r.product_types?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right">{formatInt(r.quantity)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatNaira(r.total_amount)}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3">{r.delivery_date ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "pending" && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "approved")}>Approve</Button>}
                          {r.status === "approved" && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "fulfilled")}>Fulfill</Button>}
                          {r.status !== "cancelled" && r.status !== "fulfilled" && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "cancelled")}>Cancel</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
