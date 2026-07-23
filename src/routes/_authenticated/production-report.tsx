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
import { ClipboardList } from "lucide-react";
import { formatInt, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/production-report")({
  head: () => ({
    meta: [
      { title: "Production Report — Next Tsaraba" },
      { name: "description", content: "Weekly production report with per-product output, staff, and damages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductionReportPage,
});

const PRODUCTS = [
  { key: "bcnt", label: "BCNT" },
  { key: "top", label: "TOP" },
  { key: "sup", label: "SUP" },
  { key: "exe", label: "EXE" },
  { key: "brw", label: "BRW" },
  { key: "scnt", label: "SCNT" },
  { key: "nat", label: "NAT" },
  { key: "mac", label: "MAC" },
] as const;

function ProductionReportPage() {
  const qc = useQueryClient();
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const reportsQ = useQuery({
    queryKey: ["production-reports", weekStart],
    queryFn: async () => {
      const end = dates[dates.length - 1];
      const { data, error } = await supabase
        .from("production_reports")
        .select("*")
        .gte("report_date", weekStart)
        .lte("report_date", end)
        .order("report_date");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const reportByDate: Record<string, any> = {};
  for (const r of reportsQ.data ?? []) reportByDate[r.report_date] = r;

  const emptyRow = (date: string) => {
    const row: any = { report_date: date };
    for (const p of PRODUCTS) {
      row[`${p.key}_used`] = 0;
      row[`${p.key}_produced`] = 0;
      row[`${p.key}_damaged`] = 0;
    }
    row.total_used = 0;
    row.total_produced = 0;
    row.bakers = 0;
    row.packers = 0;
    row.management = 0;
    row.total_staff = 0;
    return row;
  };

  const computeTotals = (row: any) => {
    row.total_used = PRODUCTS.reduce((s, p) => s + (Number(row[`${p.key}_used`]) || 0), 0);
    row.total_produced = PRODUCTS.reduce((s, p) => s + (Number(row[`${p.key}_produced`]) || 0), 0);
    row.total_staff = (Number(row.bakers) || 0) + (Number(row.packers) || 0) + (Number(row.management) || 0);
    return row;
  };

  const startEdit = (date: string) => {
    const existing = reportByDate[date];
    const base = existing ? { ...existing } : emptyRow(date);
    const f: any = {};
    for (const p of PRODUCTS) {
      f[`${p.key}_used`] = String(base[`${p.key}_used`] || 0);
      f[`${p.key}_produced`] = String(base[`${p.key}_produced`] || 0);
      f[`${p.key}_damaged`] = String(base[`${p.key}_damaged`] || 0);
    }
    f.total_used = String(base.total_used || 0);
    f.total_produced = String(base.total_produced || 0);
    f.bakers = String(base.bakers || 0);
    f.packers = String(base.packers || 0);
    f.management = String(base.management || 0);
    f.total_staff = String(base.total_staff || 0);
    f.id = base.id || "";
    f.report_date = date;
    setForms((prev) => ({ ...prev, [date]: f }));
    setEditing(date);
  };

  const cancelEdit = () => setEditing(null);

  const saveRow = async (date: string) => {
    const f = forms[date];
    if (!f) return;
    setSaving(true);
    const payload: any = { report_date: date };
    for (const p of PRODUCTS) {
      payload[`${p.key}_used`] = Number(f[`${p.key}_used`]) || 0;
      payload[`${p.key}_produced`] = Number(f[`${p.key}_produced`]) || 0;
      payload[`${p.key}_damaged`] = Number(f[`${p.key}_damaged`]) || 0;
    }
    payload.bakers = Number(f.bakers) || 0;
    payload.packers = Number(f.packers) || 0;
    payload.management = Number(f.management) || 0;
    const computed = computeTotals(payload);
    payload.total_used = computed.total_used;
    payload.total_produced = computed.total_produced;
    payload.total_staff = computed.total_staff;

    const existing = reportByDate[date];
    const { error } = existing
      ? await supabase.from("production_reports").update(payload).eq("id", existing.id)
      : await supabase.from("production_reports").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    try {
      if (existing) {
        await writeAuditLog({ table_name: "production_reports", record_id: existing.id, action: "UPDATE", old_values: existing, new_values: payload });
      } else {
        await writeAuditLog({ table_name: "production_reports", action: "INSERT", new_values: payload });
      }
    } catch { /* silent */ }
    toast.success(existing ? "Updated" : "Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["production-reports", weekStart] });
  };

  const navWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const weekTotals = dates.reduce(
    (a, date) => {
      const r = reportByDate[date];
      if (!r) return a;
      for (const p of PRODUCTS) {
        a[`${p.key}_used`] += Number(r[`${p.key}_used`]) || 0;
        a[`${p.key}_produced`] += Number(r[`${p.key}_produced`]) || 0;
        a[`${p.key}_damaged`] += Number(r[`${p.key}_damaged`]) || 0;
      }
      a.total_used += Number(r.total_used) || 0;
      a.total_produced += Number(r.total_produced) || 0;
      a.bakers += Number(r.bakers) || 0;
      a.packers += Number(r.packers) || 0;
      a.management += Number(r.management) || 0;
      return a;
    },
    { total_used: 0, total_produced: 0, bakers: 0, packers: 0, management: 0 } as any,
  );
  for (const p of PRODUCTS) {
    weekTotals[`${p.key}_used`] = weekTotals[`${p.key}_used`] || 0;
    weekTotals[`${p.key}_produced`] = weekTotals[`${p.key}_produced`] || 0;
    weekTotals[`${p.key}_damaged`] = weekTotals[`${p.key}_damaged`] || 0;
  }

  const cell = (v: any) => (v && Number(v) > 0 ? formatInt(Number(v)) : "—");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Production Report
        </h1>
        <p className="text-sm text-muted-foreground">
          Weekly production report — per-product output, staff, and damages.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navWeek(-1)}>← Prev week</Button>
        <span className="text-sm font-medium">
          Week of {dates[0]} — {dates[6]}
        </span>
        <Button variant="outline" size="sm" onClick={() => navWeek(1)}>Next week →</Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const d = new Date(today);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          d.setDate(diff);
          setWeekStart(d.toISOString().slice(0, 10));
        }}>This week</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bags Used & Produced</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportsQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ScrollArea>
              <div className="min-w-[1200px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2.5 text-left" rowSpan={2}>DATE</th>
                      <th className="px-2 py-2.5 text-center bg-blue-50/50 dark:bg-blue-950/20" colSpan={16}>
                        TOTAL NUMBER OF BAGS PRODUCED
                      </th>
                      <th className="px-2 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/20" colSpan={2}>TOTAL</th>
                      <th className="px-2 py-2.5 text-center bg-green-50/50 dark:bg-green-950/20" colSpan={4}>
                        TOTAL NUMBER OF PRODUCTION STAFF
                      </th>
                      <th className="px-2 py-2.5 text-center bg-red-50/50 dark:bg-red-950/20" colSpan={8}>
                        TOTAL NUMBER OF DAMAGED PRODUCED
                      </th>
                      <th className="px-2 py-2.5"></th>
                    </tr>
                    <tr className="bg-muted/30 text-[10px]">
                      {PRODUCTS.map((p) => (
                        <th key={p.key} className="px-1 py-1.5 text-center bg-blue-50/30 dark:bg-blue-950/10" colSpan={2}>
                          {p.label}
                        </th>
                      ))}
                      <th className="px-1 py-1.5 text-center bg-amber-50/30 dark:bg-amber-950/10">USED</th>
                      <th className="px-1 py-1.5 text-center bg-amber-50/30 dark:bg-amber-950/10">PROD.</th>
                      <th className="px-1 py-1.5 text-center bg-green-50/30 dark:bg-green-950/10">BAKERS</th>
                      <th className="px-1 py-1.5 text-center bg-green-50/30 dark:bg-green-950/10">PKGS.</th>
                      <th className="px-1 py-1.5 text-center bg-green-50/30 dark:bg-green-950/10">MNGMT</th>
                      <th className="px-1 py-1.5 text-center bg-green-50/30 dark:bg-green-950/10">TOTAL</th>
                      {PRODUCTS.map((p) => (
                        <th key={`d-${p.key}`} className="px-1 py-1.5 text-center bg-red-50/30 dark:bg-red-950/10">
                          {p.label}
                        </th>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dates.map((date) => {
                      const r = reportByDate[date];
                      const isEditing = editing === date;
                      const f = forms[date];
                      const dayName = new Date(date).toLocaleDateString("en", { weekday: "short" });
                      return (
                        <tr key={date} className={isEditing ? "bg-muted/20" : ""}>
                          <td className="px-2 py-1.5 font-medium text-xs sticky left-0 bg-background z-10">
                            {date} <span className="text-muted-foreground">({dayName})</span>
                          </td>
                          {PRODUCTS.map((p) => (
                            <td key={`${date}-${p.key}-used`} className="px-1 py-1.5 text-right text-xs bg-blue-50/20 dark:bg-blue-950/5">
                              {isEditing && f ? (
                                <input className="w-12 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                  value={f[`${p.key}_used`]}
                                  onChange={(e) => setForms({ ...forms, [date]: { ...f, [`${p.key}_used`]: e.target.value } })} />
                              ) : cell(r?.[`${p.key}_used`])}
                            </td>
                          ))}
                          {PRODUCTS.map((p) => (
                            <td key={`${date}-${p.key}-prod`} className="px-1 py-1.5 text-right text-xs bg-blue-50/20 dark:bg-blue-950/5">
                              {isEditing && f ? (
                                <input className="w-12 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                  value={f[`${p.key}_produced`]}
                                  onChange={(e) => setForms({ ...forms, [date]: { ...f, [`${p.key}_produced`]: e.target.value } })} />
                              ) : cell(r?.[`${p.key}_produced`])}
                            </td>
                          ))}
                          <td className="px-1 py-1.5 text-right text-xs font-semibold bg-amber-50/30 dark:bg-amber-950/10">
                            {isEditing && f ? (
                              <input className="w-12 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.total_used}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, total_used: e.target.value } })} />
                            ) : cell(r?.total_used)}
                          </td>
                          <td className="px-1 py-1.5 text-right text-xs font-semibold bg-amber-50/30 dark:bg-amber-950/10">
                            {isEditing && f ? (
                              <input className="w-12 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.total_produced}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, total_produced: e.target.value } })} />
                            ) : cell(r?.total_produced)}
                          </td>
                          <td className="px-1 py-1.5 text-right text-xs bg-green-50/30 dark:bg-green-950/10">
                            {isEditing && f ? (
                              <input className="w-10 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.bakers}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, bakers: e.target.value } })} />
                            ) : cell(r?.bakers)}
                          </td>
                          <td className="px-1 py-1.5 text-right text-xs bg-green-50/30 dark:bg-green-950/10">
                            {isEditing && f ? (
                              <input className="w-10 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.packers}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, packers: e.target.value } })} />
                            ) : cell(r?.packers)}
                          </td>
                          <td className="px-1 py-1.5 text-right text-xs bg-green-50/30 dark:bg-green-950/10">
                            {isEditing && f ? (
                              <input className="w-10 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.management}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, management: e.target.value } })} />
                            ) : cell(r?.management)}
                          </td>
                          <td className="px-1 py-1.5 text-right text-xs font-semibold bg-green-50/30 dark:bg-green-950/10">
                            {isEditing && f ? (
                              <input className="w-10 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                value={f.total_staff}
                                onChange={(e) => setForms({ ...forms, [date]: { ...f, total_staff: e.target.value } })} />
                            ) : cell(r?.total_staff)}
                          </td>
                          {PRODUCTS.map((p) => (
                            <td key={`${date}-${p.key}-dmg`} className="px-1 py-1.5 text-right text-xs bg-red-50/30 dark:bg-red-950/10">
                              {isEditing && f ? (
                                <input className="w-10 text-right bg-transparent border-b border-border outline-none text-xs" type="number" min="0"
                                  value={f[`${p.key}_damaged`]}
                                  onChange={(e) => setForms({ ...forms, [date]: { ...f, [`${p.key}_damaged`]: e.target.value } })} />
                              ) : cell(r?.[`${p.key}_damaged`])}
                            </td>
                          ))}
                          <td className="px-1 py-1.5 text-right">
                            {isEditing ? (
                              <div className="flex gap-0.5">
                                <button className="text-xs text-primary hover:underline" disabled={saving} onClick={() => saveRow(date)}>Save</button>
                                <button className="text-xs text-muted-foreground hover:underline" onClick={cancelEdit}>X</button>
                              </div>
                            ) : (
                              <button className="text-xs text-muted-foreground hover:underline" onClick={() => startEdit(date)}>
                                {r ? "Edit" : "Add"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/30 font-semibold text-xs">
                    <tr>
                      <td className="px-2 py-1.5 sticky left-0 bg-muted/30 z-10">WEEK TOTAL</td>
                      {PRODUCTS.map((p) => (
                        <td key={`wt-${p.key}-used`} className="px-1 py-1.5 text-right bg-blue-50/40 dark:bg-blue-950/15">{cell(weekTotals[`${p.key}_used`])}</td>
                      ))}
                      {PRODUCTS.map((p) => (
                        <td key={`wt-${p.key}-prod`} className="px-1 py-1.5 text-right bg-blue-50/40 dark:bg-blue-950/15">{cell(weekTotals[`${p.key}_produced`])}</td>
                      ))}
                      <td className="px-1 py-1.5 text-right bg-amber-50/40 dark:bg-amber-950/15">{cell(weekTotals.total_used)}</td>
                      <td className="px-1 py-1.5 text-right bg-amber-50/40 dark:bg-amber-950/15">{cell(weekTotals.total_produced)}</td>
                      <td className="px-1 py-1.5 text-right bg-green-50/40 dark:bg-green-950/15">{cell(weekTotals.bakers)}</td>
                      <td className="px-1 py-1.5 text-right bg-green-50/40 dark:bg-green-950/15">{cell(weekTotals.packers)}</td>
                      <td className="px-1 py-1.5 text-right bg-green-50/40 dark:bg-green-950/15">{cell(weekTotals.management)}</td>
                      <td className="px-1 py-1.5 text-right bg-green-50/40 dark:bg-green-950/15">{cell(weekTotals.bakers + weekTotals.packers + weekTotals.management)}</td>
                      {PRODUCTS.map((p) => (
                        <td key={`wt-${p.key}-dmg`} className="px-1 py-1.5 text-right bg-red-50/40 dark:bg-red-950/15">{cell(weekTotals[`${p.key}_damaged`])}</td>
                      ))}
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
