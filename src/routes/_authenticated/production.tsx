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
import { Factory } from "lucide-react";
import { formatInt, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/production")({
  head: () => ({
    meta: [
      { title: "Production — Next Tsaraba" },
      { name: "description", content: "Daily production logs by shift, damages and carry-over stock." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductionPage,
});

type Shift = "morning" | "evening";

function ProductionPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    log_date: todayISO(),
    shift: "morning" as Shift,
    bags_produced: "",
    damages: "0",
    carry_over_stock: "0",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const logsQ = useQuery({
    queryKey: ["production-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bags = Number(form.bags_produced);
    if (!Number.isFinite(bags) || bags < 0) return toast.error("Enter bags produced");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("production_logs").insert({
      log_date: form.log_date,
      shift: form.shift,
      bags_produced: bags,
      damages: Number(form.damages) || 0,
      carry_over_stock: Number(form.carry_over_stock) || 0,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Production logged");
    setForm({ ...form, bags_produced: "", damages: "0", carry_over_stock: "0", notes: "" });
    qc.invalidateQueries({ queryKey: ["production-recent"] });
    qc.invalidateQueries({ queryKey: ["dash-production"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Factory className="h-6 w-6" /> Production
        </h1>
        <p className="text-sm text-muted-foreground">Log shift output, damages and carry-over stock.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader><CardTitle className="text-base">New production log</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v as Shift })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bags produced</Label>
                <Input type="number" min="0" value={form.bags_produced} onChange={(e) => setForm({ ...form, bags_produced: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Damages (bags)</Label>
                  <Input type="number" min="0" value={form.damages} onChange={(e) => setForm({ ...form, damages: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Carry-over stock</Label>
                  <Input type="number" min="0" value={form.carry_over_stock} onChange={(e) => setForm({ ...form, carry_over_stock: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Log production"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent logs</CardTitle></CardHeader>
          <CardContent className="p-0">
            {logsQ.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : (logsQ.data ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No production logs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3 text-right">Bags</th>
                      <th className="px-4 py-3 text-right">Damages</th>
                      <th className="px-4 py-3 text-right">Carry-over</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logsQ.data!.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.log_date}</td>
                        <td className="px-4 py-3 capitalize">{r.shift}</td>
                        <td className="px-4 py-3 text-right">{formatInt(r.bags_produced)}</td>
                        <td className="px-4 py-3 text-right">{formatInt(r.damages)}</td>
                        <td className="px-4 py-3 text-right">{formatInt(r.carry_over_stock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
