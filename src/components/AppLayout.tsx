import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Droplets,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Factory,
  Package,
  Wallet,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyRoles } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/agents", label: "Agents", icon: Users },
  { to: "/production", label: "Production", icon: Factory },
  { to: "/materials", label: "Materials", icon: Package },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reconciliation", label: "Cash", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: roles } = useMyRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transform bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Next Tsaraba</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ to, label, icon: Icon, soon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {soon && (
                  <span className="rounded bg-sidebar-border/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                    soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border p-3">
          <div className="mb-2 px-2 text-xs text-sidebar-foreground/70">
            <div className="truncate">{user?.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(roles ?? []).map((r) => (
                <span key={r} className="rounded bg-sidebar-accent/60 px-1.5 py-0.5 text-[10px] capitalize">
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <button
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
