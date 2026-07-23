import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, AlertTriangle, Warehouse } from "lucide-react";
import { formatNaira, formatInt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/materials")({
  head: () => ({
    meta: [
      { title: "Raw materials — Next Tsaraba" },
      { name: "description", content: "Raw materials inventory and low-stock warnings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MaterialsPage,
});

type Mat = {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
  notes: string | null;
};

const blank = { name: "", unit: "", cost_per_unit: "", quantity_in_stock: "0", low_stock_threshold: "0", notes: "" };

function MaterialsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mat | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("raw_materials").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Mat[];
    },
  });

  const startNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const startEdit = (m: Mat) => {
    setEditing(m);
    setForm({
      name: m.name, unit: m.unit,
      cost_per_unit: String(m.cost_per_unit),
      quantity_in_stock: String(m.quantity_in_stock),
      low_stock_threshold: String(m.low_stock_threshold),
      notes: m.notes ?? "",
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.unit.trim()) return toast.error("Name and unit are required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      cost_per_unit: Number(form.cost_per_unit) || 0,
      quantity_in_stock: Number(form.quantity_in_stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from("raw_materials").update(payload).eq("id", editing.id)
      : await supabase.from("raw_materials").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Material updated" : "Material added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["dash-low-stock"] });
  };

  const remove = async (m: Mat) => {
    if (!confirm(`Delete ${m.name}?`)) return;
    const { error } = await supabase.from("raw_materials").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["materials"] });
  };

  const fgsQ = useQuery({
    queryKey: ["finished-goods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("finished_goods_stock").select("*, product_types(name)").order("product_types(name)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateFgs = async (id: string, field: "quantity_in_stock" | "low_stock_threshold" | "unit_price", value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    const payload: Record<string, number> = {};
    payload[field] = num;
    const { error } = await (supabase as any).from("finished_goods_stock").update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["finished-goods"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6" /> Stock Inventory
        </h1>
        <p className="text-sm text-muted-foreground">Raw materials and finished goods stock management.</p>
      </div>

      <Tabs defaultValue="raw-materials">
        <TabsList>
          <TabsTrigger value="raw-materials"><Package className="mr-2 h-4 w-4" /> Raw materials</TabsTrigger>
          <TabsTrigger value="finished-goods"><Warehouse className="mr-2 h-4 w-4" /> Finished goods</TabsTrigger>
        </TabsList>

        <TabsContent value="raw-materials" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Track raw material inventory and get low-stock warnings.</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New material</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit material" : "New material"}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Input placeholder="roll, kg, bag…" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cost / unit (₦)</Label>
                      <Input type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Quantity in stock</Label>
                      <Input type="number" step="0.01" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Low-stock threshold</Label>
                      <Input type="number" step="0.01" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Raw materials</CardTitle></CardHeader>
            <CardContent className="p-0">
              {q.isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Loading…</p>
              ) : (q.data ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No materials yet. Add your first one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Unit</th>
                        <th className="px-4 py-3 text-right">In stock</th>
                        <th className="px-4 py-3 text-right">Threshold</th>
                        <th className="px-4 py-3 text-right">Cost / unit</th>
                        <th className="px-4 py-3 text-right">Value</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {q.data!.map((m) => {
                        const low = Number(m.quantity_in_stock) <= Number(m.low_stock_threshold);
                        return (
                          <tr key={m.id}>
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {low && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                {m.name}
                              </div>
                            </td>
                            <td className="px-4 py-3">{m.unit}</td>
                            <td className={`px-4 py-3 text-right ${low ? "text-destructive font-semibold" : ""}`}>{Number(m.quantity_in_stock)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{Number(m.low_stock_threshold)}</td>
                            <td className="px-4 py-3 text-right">{formatNaira(m.cost_per_unit)}</td>
                            <td className="px-4 py-3 text-right">{formatNaira(Number(m.quantity_in_stock) * Number(m.cost_per_unit))}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => startEdit(m)}>Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => remove(m)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finished-goods" className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">Finished product stock levels by type.</p>
          <Card>
            <CardHeader><CardTitle className="text-base">Finished goods</CardTitle></CardHeader>
            <CardContent className="p-0">
              {fgsQ.isLoading ? (
                <p className="p-6 text-sm text-muted-foreground">Loading…</p>
              ) : (fgsQ.data ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No finished goods tracking yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-right">In stock</th>
                        <th className="px-4 py-3 text-right">Threshold</th>
                        <th className="px-4 py-3 text-right">Unit price</th>
                        <th className="px-4 py-3 text-right">Stock value</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fgsQ.data!.map((r: any) => {
                        const low = Number(r.quantity_in_stock) <= Number(r.low_stock_threshold);
                        return (
                          <tr key={r.id}>
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {low && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                {r.product_types?.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input
                                type="number" min="0" size={6}
                                value={r.quantity_in_stock}
                                onChange={(e: any) => updateFgs(r.id, "quantity_in_stock", e.target.value)}
                                className="h-8 w-20 text-right inline-block"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input
                                type="number" min="0" size={6}
                                value={r.low_stock_threshold}
                                onChange={(e: any) => updateFgs(r.id, "low_stock_threshold", e.target.value)}
                                className="h-8 w-20 text-right inline-block"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input
                                type="number" step="0.01" min="0" size={8}
                                value={r.unit_price}
                                onChange={(e: any) => updateFgs(r.id, "unit_price", e.target.value)}
                                className="h-8 w-24 text-right inline-block"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatNaira(Number(r.quantity_in_stock) * Number(r.unit_price))}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                              {low ? "Low stock" : "OK"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
