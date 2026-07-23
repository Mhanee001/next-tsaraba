import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatNaira } from "@/lib/format";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Next Tsaraba" },
      { name: "description", content: "Manage sales agents, commission rates and credit balances." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "", commission_rate: "0" });
  const [saving, setSaving] = useState(false);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = agents.filter((a) =>
    (a.name + " " + (a.phone ?? "") + " " + (a.location ?? ""))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.from("agents").insert({
      name: form.name.trim(),
      phone: form.phone || null,
      location: form.location || null,
      commission_rate: Number(form.commission_rate) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    try { await writeAuditLog({ table_name: "agents", action: "INSERT", new_values: { name: form.name.trim(), phone: form.phone || null, location: form.location || null, commission_rate: Number(form.commission_rate) || 0 } }); } catch { /* silent */ }
    toast.success("Agent added");
    setOpen(false);
    setForm({ name: "", phone: "", location: "", commission_rate: "0" });
    qc.invalidateQueries({ queryKey: ["agents"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            {agents.length} total · {agents.filter((a) => a.is_active).length} active
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Commission (₦ per bag)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Add agent"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {agents.length === 0 ? "No agents yet. Add your first agent to get started." : "No agents match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/agents/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.phone, a.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Credit</p>
                        <p className={"font-semibold " + (Number(a.credit_balance) > 0 ? "text-warning-foreground" : "")}>
                          {formatNaira(a.credit_balance)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
