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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";
import { formatInt, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/ingredient-usage")({
  head: () => ({
    meta: [
      { title: "Ingredient Usage — Next Tsaraba" },
      { name: "description", content: "Daily ingredient usage per product: flour, sugar, salt and preservatives." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IngredientUsagePage,
});

type ProductType = { id: string; name: string };
type UsageLog = {
  id: string;
  log_date: string;
  product_type_id: string;
  flour_bags: number;
  flour_measure_g: number;
  flour_used_g: number;
  sugar_measure_g: number;
  sugar_used_g: number;
  salt_measure_g: number;
  salt_used_g: number;
  preservatives_measure_g: number;
  preservatives_used_g: number;
  notes: string | null;
};

type UsageForm = {
  flour_bags: string;
  flour_measure_g: string;
  flour_used_g: string;
  sugar_measure_g: string;
  sugar_used_g: string;
  salt_measure_g: string;
  salt_used_g: string;
  preservatives_measure_g: string;
  preservatives_used_g: string;
};

const emptyForm = (): UsageForm => ({
  flour_bags: "",
  flour_measure_g: "",
  flour_used_g: "",
  sugar_measure_g: "",
  sugar_used_g: "",
  salt_measure_g: "",
  salt_used_g: "",
  preservatives_measure_g: "",
  preservatives_used_g: "",
});

function IngredientUsagePage() {
  const qc = useQueryClient();
  const today = todayISO();
  const [logDate, setLogDate] = useState(today);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, UsageForm>>({});
  const [saving, setSaving] = useState(false);

  const productsQ = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_types").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as ProductType[];
    },
  });

  const logsQ = useQuery({
    queryKey: ["ingredient-usage", logDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingredient_usage_logs")
        .select("*")
        .eq("log_date", logDate);
      if (error) throw error;
      return (data ?? []) as UsageLog[];
    },
  });

  const logsByProduct: Record<string, UsageLog> = {};
  for (const log of logsQ.data ?? []) {
    logsByProduct[log.product_type_id] = log;
  }

  const startEdit = (productId: string) => {
    const existing = logsByProduct[productId];
    setForms((prev) => ({
      ...prev,
      [productId]: existing
        ? {
            flour_bags: String(existing.flour_bags),
            flour_measure_g: String(existing.flour_measure_g),
            flour_used_g: String(existing.flour_used_g),
            sugar_measure_g: String(existing.sugar_measure_g),
            sugar_used_g: String(existing.sugar_used_g),
            salt_measure_g: String(existing.salt_measure_g),
            salt_used_g: String(existing.salt_used_g),
            preservatives_measure_g: String(existing.preservatives_measure_g),
            preservatives_used_g: String(existing.preservatives_used_g),
          }
        : emptyForm(),
    }));
    setEditingProduct(productId);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

  const saveLog = async (productTypeId: string) => {
    const f = forms[productTypeId];
    if (!f) return;
    setSaving(true);
    const payload = {
      log_date: logDate,
      product_type_id: productTypeId,
      flour_bags: Number(f.flour_bags) || 0,
      flour_measure_g: Number(f.flour_measure_g) || 0,
      flour_used_g: Number(f.flour_used_g) || 0,
      sugar_measure_g: Number(f.sugar_measure_g) || 0,
      sugar_used_g: Number(f.sugar_used_g) || 0,
      salt_measure_g: Number(f.salt_measure_g) || 0,
      salt_used_g: Number(f.salt_used_g) || 0,
      preservatives_measure_g: Number(f.preservatives_measure_g) || 0,
      preservatives_used_g: Number(f.preservatives_used_g) || 0,
    };
    const existing = logsByProduct[productTypeId];
    const { error } = existing
      ? await supabase.from("ingredient_usage_logs").update(payload).eq("id", existing.id)
      : await supabase.from("ingredient_usage_logs").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    try {
      if (existing) {
        await writeAuditLog({ table_name: "ingredient_usage_logs", record_id: existing.id, action: "UPDATE", old_values: existing, new_values: payload });
      } else {
        await writeAuditLog({ table_name: "ingredient_usage_logs", action: "INSERT", new_values: payload });
      }
    } catch { /* silent */ }
    toast.success(existing ? "Updated" : "Saved");
    setEditingProduct(null);
    qc.invalidateQueries({ queryKey: ["ingredient-usage", logDate] });
  };

  const deleteLog = async (log: UsageLog) => {
    if (!confirm("Delete this usage record?")) return;
    const { error } = await supabase.from("ingredient_usage_logs").delete().eq("id", log.id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "ingredient_usage_logs", record_id: log.id, action: "DELETE", old_values: log }); } catch { /* silent */ }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["ingredient-usage", logDate] });
  };

  const products = productsQ.data ?? [];
  const logs = logsQ.data ?? [];

  const totals = {
    flour_bags: logs.reduce((s, r) => s + Number(r.flour_bags), 0),
    flour_used_g: logs.reduce((s, r) => s + Number(r.flour_used_g), 0),
    sugar_used_g: logs.reduce((s, r) => s + Number(r.sugar_used_g), 0),
    salt_used_g: logs.reduce((s, r) => s + Number(r.salt_used_g), 0),
    preservatives_used_g: logs.reduce((s, r) => s + Number(r.preservatives_used_g), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Ingredient Usage
        </h1>
        <p className="text-sm text-muted-foreground">
          Track daily flour, sugar, salt and preservatives usage per product.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-56 space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="mt-6" onClick={() => setLogDate(today)}>
          Today
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Usage for {logDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {productsQ.isLoading || logsQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No product types found.</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[900px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 w-40">Product</th>
                      <th className="px-3 py-3 text-right">Bags</th>
                      <th className="px-3 py-3 text-right bg-amber-50 dark:bg-amber-950/20" colSpan={2}>Flour (g)</th>
                      <th className="px-3 py-3 text-right bg-blue-50 dark:bg-blue-950/20" colSpan={2}>Sugar (g)</th>
                      <th className="px-3 py-3 text-right bg-green-50 dark:bg-green-950/20" colSpan={2}>Salt (g)</th>
                      <th className="px-3 py-3 text-right bg-purple-50 dark:bg-purple-950/20" colSpan={2}>Preservatives (g)</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                    <tr className="bg-muted/30 text-xs text-muted-foreground">
                      <th></th>
                      <th className="px-3 py-2 text-right">Prod.</th>
                      <th className="px-3 py-2 text-right bg-amber-50/50 dark:bg-amber-950/10">Measure</th>
                      <th className="px-3 py-2 text-right bg-amber-50/50 dark:bg-amber-950/10">Used</th>
                      <th className="px-3 py-2 text-right bg-blue-50/50 dark:bg-blue-950/10">Measure</th>
                      <th className="px-3 py-2 text-right bg-blue-50/50 dark:bg-blue-950/10">Used</th>
                      <th className="px-3 py-2 text-right bg-green-50/50 dark:bg-green-950/10">Measure</th>
                      <th className="px-3 py-2 text-right bg-green-50/50 dark:bg-green-950/10">Used</th>
                      <th className="px-3 py-2 text-right bg-purple-50/50 dark:bg-purple-950/10">Measure</th>
                      <th className="px-3 py-2 text-right bg-purple-50/50 dark:bg-purple-950/10">Used</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => {
                      const log = logsByProduct[p.id];
                      const isEditing = editingProduct === p.id;
                      const f = forms[p.id];

                      if (isEditing && f) {
                        return (
                          <tr key={p.id} className="bg-muted/20">
                            <td className="px-4 py-2 font-medium">{p.name}</td>
                            <td className="px-3 py-2">
                              <Input type="number" min="0" step="0.5" size={5}
                                value={f.flour_bags}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, flour_bags: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-amber-50/30 dark:bg-amber-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.flour_measure_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, flour_measure_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-amber-50/30 dark:bg-amber-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.flour_used_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, flour_used_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-blue-50/30 dark:bg-blue-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.sugar_measure_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, sugar_measure_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-blue-50/30 dark:bg-blue-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.sugar_used_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, sugar_used_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-green-50/30 dark:bg-green-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.salt_measure_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, salt_measure_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-green-50/30 dark:bg-green-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.salt_used_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, salt_used_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-purple-50/30 dark:bg-purple-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.preservatives_measure_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, preservatives_measure_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2 bg-purple-50/30 dark:bg-purple-950/10">
                              <Input type="number" min="0" step="0.1" size={6}
                                value={f.preservatives_used_g}
                                onChange={(e) => setForms({ ...forms, [p.id]: { ...f, preservatives_used_g: e.target.value } })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <Button size="sm" disabled={saving} onClick={() => saveLog(p.id)}>
                                  {saving ? "…" : "Save"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-3 py-3 text-right font-medium">{log ? formatInt(log.flour_bags) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-amber-50/30 dark:bg-amber-950/10">{log ? formatInt(log.flour_measure_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-amber-50/30 dark:bg-amber-950/10">{log ? formatInt(log.flour_used_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-blue-50/30 dark:bg-blue-950/10">{log ? formatInt(log.sugar_measure_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-blue-50/30 dark:bg-blue-950/10">{log ? formatInt(log.sugar_used_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-green-50/30 dark:bg-green-950/10">{log ? formatInt(log.salt_measure_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-green-50/30 dark:bg-green-950/10">{log ? formatInt(log.salt_used_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-purple-50/30 dark:bg-purple-950/10">{log ? formatInt(log.preservatives_measure_g) : "—"}</td>
                          <td className="px-3 py-3 text-right bg-purple-50/30 dark:bg-purple-950/10">{log ? formatInt(log.preservatives_used_g) : "—"}</td>
                          <td className="px-3 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(p.id)}>
                              {log ? "Edit" : "Add"}
                            </Button>
                            {log && (
                              <Button variant="ghost" size="sm" onClick={() => deleteLog(log)}>Del</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-sm">TOTAL</td>
                      <td className="px-3 py-3 text-right">{formatInt(totals.flour_bags)}</td>
                      <td className="px-3 py-3 text-right bg-amber-50/40 dark:bg-amber-950/20">—</td>
                      <td className="px-3 py-3 text-right bg-amber-50/40 dark:bg-amber-950/20">{formatInt(totals.flour_used_g)}</td>
                      <td className="px-3 py-3 text-right bg-blue-50/40 dark:bg-blue-950/20">—</td>
                      <td className="px-3 py-3 text-right bg-blue-50/40 dark:bg-blue-950/20">{formatInt(totals.sugar_used_g)}</td>
                      <td className="px-3 py-3 text-right bg-green-50/40 dark:bg-green-950/20">—</td>
                      <td className="px-3 py-3 text-right bg-green-50/40 dark:bg-green-950/20">{formatInt(totals.salt_used_g)}</td>
                      <td className="px-3 py-3 text-right bg-purple-50/40 dark:bg-purple-950/20">—</td>
                      <td className="px-3 py-3 text-right bg-purple-50/40 dark:bg-purple-950/20">{formatInt(totals.preservatives_used_g)}</td>
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
  );
}
