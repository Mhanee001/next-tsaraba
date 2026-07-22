import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, LineChart, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Next Tsaraba</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Sachet Water Operations
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Run the factory from one clean dashboard.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Replace ninety-six spreadsheet tabs with real-time production, sales,
              inventory, cash reconciliation, and payroll — designed for daily entry on
              a phone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Sign in to continue</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ mode: "signup" } as never}>
                  Create an account
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Droplets, label: "Production", note: "Morning & evening logs" },
              { icon: Users, label: "Agents", note: "Credit & commission ledger" },
              { icon: Wallet, label: "Cash", note: "Daily reconciliation" },
              { icon: LineChart, label: "Reports", note: "Profit & top agents" },
            ].map(({ icon: Icon, label, note }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-3 font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
