import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Users, Wallet, AlertTriangle, TrendingUp, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNaira, formatInt, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Next Tsaraba" },
      { name: "description", content: "Today's production, cash collected, credit outstanding, and low-stock alerts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "primary" | "accent" | "success" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={"flex h-11 w-11 items-center justify-center rounded-lg " + toneClass}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const today = todayISO();

  const production = useQuery({
    queryKey: ["dash-prod", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_logs")
        .select("bags_produced, damages")
        .eq("log_date", today);
      if (error) throw error;
      const bags = (data ?? []).reduce((s, r) => s + (r.bags_produced ?? 0), 0);
      const dmg = (data ?? []).reduce((s, r) => s + (r.damages ?? 0), 0);
      return { bags, dmg };
    },
  });

  const sales = useQuery({
    queryKey: ["dash-sales", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_records")
        .select("gross_amount, cash_collected, credit_amount")
        .eq("sale_date", today);
      if (error) throw error;
      const rows = data ?? [];
      return {
        gross: rows.reduce((s, r) => s + Number(r.gross_amount ?? 0), 0),
        cash: rows.reduce((s, r) => s + Number(r.cash_collected ?? 0), 0),
        credit: rows.reduce((s, r) => s + Number(r.credit_amount ?? 0), 0),
        count: rows.length,
      };
    },
  });

  const credit = useQuery({
    queryKey: ["dash-credit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("credit_balance");
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.credit_balance ?? 0), 0);
    },
  });

  const lowStock = useQuery({
    queryKey: ["dash-lowstock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("id, name, quantity_in_stock, low_stock_threshold, unit");
      if (error) throw error;
      return (data ?? []).filter((m) => Number(m.quantity_in_stock) <= Number(m.low_stock_threshold));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today at a glance</h1>
          <p className="text-sm text-muted-foreground">
            Live figures from production, sales, agent credit and inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/sales">Record sale</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/agents">Manage agents</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bags produced today"
          value={formatInt(production.data?.bags)}
          icon={Droplets}
          hint={`${formatInt(production.data?.dmg)} damaged`}
        />
        <StatCard
          label="Cash collected today"
          value={formatNaira(sales.data?.cash)}
          icon={Wallet}
          tone="success"
          hint={`${sales.data?.count ?? 0} sales`}
        />
        <StatCard
          label="Credit issued today"
          value={formatNaira(sales.data?.credit)}
          icon={TrendingUp}
          tone="accent"
          hint={`Gross ${formatNaira(sales.data?.gross)}`}
        />
        <StatCard
          label="Total outstanding credit"
          value={formatNaira(credit.data)}
          icon={Users}
          tone="warning"
          hint="All active agents"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Inventory warnings
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/materials">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lowStock.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (lowStock.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No low-stock items. Add materials in the Materials module to enable warnings.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(lowStock.data ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                    <span className="font-medium">{m.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatInt(m.quantity_in_stock)} {m.unit} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
