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
  ClipboardList,
  FileText,
  Printer,
  Landmark,
  Crown,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyRoles } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { to: string; label: string; icon: LucideIcon };
type NavGroup = {
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    children: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/managing-director", label: "Executive", icon: Crown },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    children: [
      { to: "/sales", label: "Sales", icon: ShoppingCart },
      { to: "/factory-sales", label: "Factory Sales", icon: Factory },
      { to: "/agents", label: "Agents", icon: Users },
      { to: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Production",
    icon: Factory,
    children: [
      { to: "/production", label: "Logs", icon: Factory },
      { to: "/production-report", label: "Report", icon: ClipboardList },
      { to: "/materials", label: "Stock", icon: Package },
      { to: "/stock-inventory", label: "Inventory", icon: Package },
      { to: "/ingredient-usage", label: "Ingredients", icon: ClipboardList },
      { to: "/pro-form", label: "Pro-forma", icon: FileText },
      { to: "/printing", label: "Printing", icon: Printer },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    children: [
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/reconciliation", label: "Reconciliation", icon: Wallet },
      { to: "/cash-summary", label: "Cash Summary", icon: Landmark },
      { to: "/cash-flow", label: "Cash Flow", icon: Landmark },
      { to: "/cash-flow-by-person", label: "Cash by Person", icon: Users },
    ],
  },
  {
    label: "System",
    icon: History,
    children: [
      { to: "/audit-log", label: "Audit Log", icon: History },
    ],
  },
];

const allPaths = GROUPS.flatMap((g) => g.children.map((c) => c.to));

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: roles } = useMyRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const activePath = allPaths
    .filter((p) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const [expanded, setExpanded] = useState<string[]>(() => {
    const group = GROUPS.find((g) => g.children.some((c) => c.to === activePath));
    return group ? [group.label] : [];
  });

  const toggle = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const handleLinkClick = () => setOpen(false);

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transform bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Next Tsaraba</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {GROUPS.map((group) => {
            const isExpanded = expanded.includes(group.label);
            const hasActive = group.children.some((c) => c.to === activePath);
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggle(group.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    hasActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    <span className="font-medium">{group.label}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                    {group.children.map((item) => {
                      const active = pathname === item.to || pathname.startsWith(item.to + "/");
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
