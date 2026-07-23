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
import { Printer, Plus } from "lucide-react";
import { formatNaira, formatInt, todayISO } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/printing")({
  head: () => ({
    meta: [
      { title: "Printing — Next Tsaraba" },
      { name: "description", content: "Printing job tracking for labels, packaging and materials." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrintingPage,
});

const ITEM_TYPES = ["label", "bag", "flyer", "poster", "packaging", "other"];

function PrintingPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    job_date: todayISO(),
    description: "",
    item_type: "label",
    quantity: "",
    cost: "",
    vendor: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const jobsQ = useQuery({
    queryKey: ["printing-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("printing_jobs").select("*").order("job_date", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error("Description is required");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("printing_jobs").insert({
      job_date: form.job_date,
      description: form.description.trim(),
      item_type: form.item_type,
      quantity: Number(form.quantity) || 0,
      cost: Number(form.cost) || 0,
      vendor: form.vendor || null,
      notes: form.notes || null,
      logged_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "printing_jobs", action: "INSERT", new_values: { job_date: form.job_date, description: form.description.trim(), item_type: form.item_type, quantity: Number(form.quantity) || 0, cost: Number(form.cost) || 0, vendor: form.vendor || null, notes: form.notes || null, logged_by: userData.user?.id ?? null } }); } catch { /* silent */ }
    toast.success("Printing job saved");
    setForm({ job_date: todayISO(), description: "", item_type: "label", quantity: "", cost: "", vendor: "", notes: "" });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["printing-jobs"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    const { data: oldJob } = await supabase.from("printing_jobs").select("*").eq("id", id).single();
    const { error } = await supabase.from("printing_jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "printing_jobs", record_id: id, action: "DELETE", old_values: oldJob ?? undefined }); } catch { /* silent */ }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["printing-jobs"] });
  };

  const totalCost = (jobsQ.data ?? []).reduce((s: number, r: any) => s + Number(r.cost), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Printer className="h-6 w-6" /> Printing
          </h1>
          <p className="text-sm text-muted-foreground">Track printing jobs for labels, packaging and materials.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> New job</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New printing job</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.job_date} onChange={(e) => setForm({ ...form, job_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Item type</Label>
                  <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost (₦)</Label>
                  <Input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vendor</Label>
                  <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save job"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Job history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {jobsQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (jobsQ.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No printing jobs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobsQ.data!.map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">{r.job_date}</td>
                      <td className="px-4 py-3 capitalize">{r.item_type}</td>
                      <td className="px-4 py-3 font-medium">{r.description}</td>
                      <td className="px-4 py-3 text-right">{formatInt(r.quantity)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatNaira(r.cost)}</td>
                      <td className="px-4 py-3">{r.vendor ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Del</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/30 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-right">{formatNaira(totalCost)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
