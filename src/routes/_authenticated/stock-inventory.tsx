import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Package, AlertTriangle } from "lucide-react";
import { formatNaira, formatInt, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock-inventory")({
  head: () => ({
    meta: [
      { title: "Stock Inventory — Next Tsaraba" },
      { name: "description", content: "Full stock inventory view with cost tracking, usage breakdown, and leftover calculations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StockInventoryPage,
});

const GRAMS_PER_BAG: Record<string, number> = {
  FLOUR: 50000,
  SUGAR: 50000,
  SALT: 50000,
  PRESERVATIVES: 20000,
};

const INGREDIENTS = ["FLOUR", "SUGAR", "SALT", "PRESERVATIVES"] as const;

function StockInventoryPage() {
  const today = todayISO();
  const [logDate, setLogDate] = useState(today);

  const matsQ = useQuery({
    queryKey: ["raw-materials-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .in("name", INGREDIENTS);
      if (error) throw error;
      return (data ?? []) as RawMat[];
    },
  });

  const productsQ = useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_types").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
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

  const matByName: Record<string, RawMat> = {};
  for (const m of matsQ.data ?? []) matByName[m.name] = m;

  const logsByProduct: Record<string, UsageLog> = {};
  for (const log of logsQ.data ?? []) logsByProduct[log.product_type_id] = log;

  const products = productsQ.data ?? [];

  const totals = {
    flour_bags: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.flour_bags ?? 0), 0),
    flour_used_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.flour_used_g ?? 0), 0),
    flour_measure_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.flour_measure_g ?? 0), 0),
    sugar_used_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.sugar_used_g ?? 0), 0),
    sugar_measure_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.sugar_measure_g ?? 0), 0),
    salt_used_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.salt_used_g ?? 0), 0),
    salt_measure_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.salt_measure_g ?? 0), 0),
    preservatives_used_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.preservatives_used_g ?? 0), 0),
    preservatives_measure_g: products.reduce((s, p) => s + Number(logsByProduct[p.id]?.preservatives_measure_g ?? 0), 0),
  };

  const costOfUse = (ingredient: string, usedG: number) => {
    const m = matByName[ingredient];
    if (!m || !usedG) return 0;
    return (m.cost_per_unit / (GRAMS_PER_BAG[ingredient] || 50000)) * usedG;
  };

  const leftoverG = (ingredient: string, usedG: number) => {
    const m = matByName[ingredient];
    if (!m) return 0;
    const gpb = GRAMS_PER_BAG[ingredient] || 50000;
    return m.quantity_in_stock * gpb - usedG;
  };

  const totalCostOfUse = INGREDIENTS.reduce((s, ing) => {
    const key = ing.toLowerCase() + "_used_g" as keyof typeof totals;
    return s + costOfUse(ing, totals[key] as number);
  }, 0);

  const totalUsedG = totals.flour_used_g + totals.sugar_used_g + totals.salt_used_g + totals.preservatives_used_g;

  const cell = (v: number | null | undefined, bold?: boolean) => (
    <span className={bold ? "font-semibold" : ""}>{v != null && v > 0 ? formatInt(v) : "—"}</span>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6" /> Stock Inventory
        </h1>
        <p className="text-sm text-muted-foreground">
          Flour, sugar, salt and preservatives — cost, usage, and leftovers.
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
          <CardTitle className="text-base">Stock &amp; Usage Summary — {logDate}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matsQ.isLoading || productsQ.isLoading || logsQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[1000px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 w-48">Item</th>
                      {INGREDIENTS.map((ing) => (
                        <th key={ing} className="px-3 py-3 text-center" colSpan={3}>
                          {ing === "PRESERVATIVES" ? "PRESERVATIVES" : ing}
                          <span className="block text-[10px] font-normal">
                            1 bag = {ing === "PRESERVATIVES" ? "20,000" : "50,000"}g
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center">TOTAL</th>
                    </tr>
                    <tr className="bg-muted/30 text-[10px] text-muted-foreground">
                      <th></th>
                      {INGREDIENTS.map((ing) => (
                        <React.Fragment key={ing}>
                          <th className="px-2 py-1.5 text-right">
                            {ing === "FLOUR" ? "BAGS" : ing === "PRESERVATIVES" ? "GMS" : "GMS"}
                          </th>
                          <th className="px-2 py-1.5 text-right">MEAS/g</th>
                          <th className="px-2 py-1.5 text-right">USED/g</th>
                        </React.Fragment>
                      ))}
                      <th className="px-2 py-1.5 text-right">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="bg-muted/20 font-medium">
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">COST / BAG</td>
                      {INGREDIENTS.map((ing) => {
                        const m = matByName[ing];
                        return (
                          <React.Fragment key={ing}>
                            <td className="px-3 py-2.5 text-right">{m ? formatNaira(m.cost_per_unit) : "—"}</td>
                            <td colSpan={2}></td>
                          </React.Fragment>
                        );
                      })}
                      <td></td>
                    </tr>
                    <tr className="bg-muted/20 font-medium">
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">COST / GRAM</td>
                      {INGREDIENTS.map((ing) => {
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        return (
                          <React.Fragment key={ing}>
                            <td colSpan={3} className="px-3 py-2.5 text-right">{m ? formatNaira(m.cost_per_unit / gpb) : "—"}</td>
                          </React.Fragment>
                        );
                      })}
                      <td></td>
                    </tr>
                    <tr className="bg-muted/20 font-medium">
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">QTY IN STORE</td>
                      {INGREDIENTS.map((ing) => {
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        const isLow = m && m.quantity_in_stock <= m.low_stock_threshold;
                        return (
                          <React.Fragment key={ing}>
                            <td className={`px-3 py-2.5 text-right ${isLow ? "text-amber-600" : ""}`}>
                              {m ? formatInt(m.quantity_in_stock) : "—"}
                              {isLow && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                            </td>
                            <td colSpan={2}></td>
                          </React.Fragment>
                        );
                      })}
                      <td></td>
                    </tr>
                    <tr className="bg-muted/20 font-medium">
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">QTY IN GRAMS</td>
                      {INGREDIENTS.map((ing) => {
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        return (
                          <React.Fragment key={ing}>
                            <td colSpan={3} className="px-3 py-2.5 text-right">
                              {m ? formatInt(m.quantity_in_stock * gpb) : "—"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td></td>
                    </tr>
                    <tr className="bg-muted/20 font-medium border-b-2 border-border">
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">COST (stock value)</td>
                      {INGREDIENTS.map((ing) => {
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        const val = m ? m.cost_per_unit * m.quantity_in_stock : 0;
                        return (
                          <React.Fragment key={ing}>
                            <td colSpan={3} className="px-3 py-2.5 text-right font-semibold">
                              {m ? formatNaira(val) : "—"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {formatNaira(INGREDIENTS.reduce((s, ing) => {
                          const m = matByName[ing];
                          return s + (m ? m.cost_per_unit * m.quantity_in_stock : 0);
                        }, 0))}
                      </td>
                    </tr>
                  </tbody>

                  <tbody className="divide-y divide-border">
                    {products.map((p) => {
                      const log = logsByProduct[p.id];
                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-2.5 font-medium">{p.name}</td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.flour_bags > 0 ? formatInt(log.flour_bags) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.flour_measure_g > 0 ? formatInt(log.flour_measure_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.flour_used_g > 0 ? formatInt(log.flour_used_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.sugar_measure_g > 0 ? formatInt(log.sugar_measure_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.sugar_used_g > 0 ? formatInt(log.sugar_used_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.salt_measure_g > 0 ? formatInt(log.salt_measure_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.salt_used_g > 0 ? formatInt(log.salt_used_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.preservatives_measure_g > 0 ? formatInt(log.preservatives_measure_g) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {log && log.preservatives_used_g > 0 ? formatInt(log.preservatives_used_g) : "—"}
                          </td>
                          <td></td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="border-t-2 border-border">
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-4 py-2.5">TOTAL USED</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.flour_bags, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.flour_measure_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.flour_used_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.sugar_measure_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.sugar_used_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.salt_measure_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.salt_used_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.preservatives_measure_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totals.preservatives_used_g, true)}</td>
                      <td className="px-3 py-2.5 text-right">{cell(totalUsedG, true)}</td>
                    </tr>
                    <tr className="bg-muted/20 font-semibold">
                      <td className="px-4 py-2.5">COST OF USE</td>
                      {INGREDIENTS.map((ing) => {
                        const key = ing.toLowerCase() + "_used_g" as keyof typeof totals;
                        const cost = costOfUse(ing, totals[key] as number);
                        return <td key={ing} colSpan={3} className="px-3 py-2.5 text-right">{cost > 0 ? formatNaira(cost) : "—"}</td>;
                      })}
                      <td className="px-3 py-2.5 text-right">{formatNaira(totalCostOfUse)}</td>
                    </tr>
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-4 py-2.5">LEFT OVER STOCK</td>
                      {INGREDIENTS.map((ing) => {
                        const key = ing.toLowerCase() + "_used_g" as keyof typeof totals;
                        const left = leftoverG(ing, totals[key] as number);
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        const isLow = m && left / gpb <= m.low_stock_threshold;
                        return (
                          <React.Fragment key={ing}>
                            <td colSpan={1} className={`px-3 py-2.5 text-right ${isLow ? "text-amber-600" : ""}`}>
                              {m ? formatInt(Math.max(0, left / gpb)) : "—"}
                              {isLow && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                            </td>
                            <td colSpan={2} className="px-3 py-2.5 text-right">
                              {m ? formatInt(Math.max(0, left)) : "—"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td></td>
                    </tr>
                    <tr className="bg-muted/20 font-semibold border-t-2 border-border">
                      <td className="px-4 py-2.5">LEFT OVER VALUE</td>
                      {INGREDIENTS.map((ing) => {
                        const key = ing.toLowerCase() + "_used_g" as keyof typeof totals;
                        const left = leftoverG(ing, totals[key] as number);
                        const m = matByName[ing];
                        const gpb = GRAMS_PER_BAG[ing] || 50000;
                        const val = m ? (m.cost_per_unit / gpb) * Math.max(0, left) : 0;
                        return <td key={ing} colSpan={3} className="px-3 py-2.5 text-right">{val > 0 ? formatNaira(val) : "—"}</td>;
                      })}
                      <td className="px-3 py-2.5 text-right">
                        {formatNaira(INGREDIENTS.reduce((s, ing) => {
                          const key = ing.toLowerCase() + "_used_g" as keyof typeof totals;
                          const left = leftoverG(ing, totals[key] as number);
                          const m = matByName[ing];
                          const gpb = GRAMS_PER_BAG[ing] || 50000;
                          return s + (m ? (m.cost_per_unit / gpb) * Math.max(0, left) : 0);
                        }, 0))}
                      </td>
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

type RawMat = {
  id: string;
  name: string;
  cost_per_unit: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
};

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
