import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplets, LineChart, Users, Wallet, Factory, Package, Receipt, BarChart3, ArrowRight, Shield, Zap, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: Factory, label: "Production", desc: "Morning & evening shift logs with damages and carry-over tracking." },
  { icon: Users, label: "Agents", desc: "Customer ledger with credit balance, commission, and sales history." },
  { icon: Wallet, label: "Cash", desc: "Daily reconciliation with expected vs actual variance alerts." },
  { icon: LineChart, label: "Reports", desc: "Profit analysis, top agents, production trends with charts." },
  { icon: Package, label: "Stock", desc: "Raw materials and finished goods inventory with low-stock warnings." },
  { icon: Receipt, label: "Expenses", desc: "Categorised expenditure tracking with budget oversight." },
];

const STATS = [
  { value: "96", suffix: "+", label: "Spreadsheet tabs replaced" },
  { value: "100", suffix: "%", label: "Mobile-friendly" },
  { value: "₦0", suffix: "", label: "Setup cost — open source" },
  { value: "24/7", suffix: "", label: "Cloud access" },
];

function SplashScreen() {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.04_240)] via-[oklch(0.24_0.06_240)] to-[oklch(0.15_0.03_240)] transition-all duration-700 ${
        phase === "enter" ? "opacity-0 scale-95" : phase === "exit" ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.72_0.14_200)] opacity-20" style={{ animationDuration: "2s" }} />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] shadow-lg shadow-[oklch(0.72_0.14_200)]/30">
          <Droplets className="h-12 w-12 text-white" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Next<span className="text-[oklch(0.72_0.14_200)]">Tsaraba</span>
        </h1>
        <p className={`mt-3 text-sm text-white/60 transition-all duration-700 delay-300 ${
          phase === "show" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}>
          Sachet Water Operations — Reimagined
        </p>
      </div>

      <div className="absolute bottom-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-[oklch(0.72_0.14_200)]/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-[oklch(0.42_0.13_235)]/10 to-transparent blur-3xl" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[oklch(0.72_0.14_200)]/30 animate-float"
          style={{
            left: `${15 + i * 20}%`,
            top: `${20 + i * 15}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${6 + i * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.8; }
        }
        .animate-float { animation: float linear infinite; }
      `}</style>
    </div>
  );
}

function Landing() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2900);
    return () => clearTimeout(t);
  }, []);

  if (!splashDone) return <SplashScreen />;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -20px) rotate(2deg); }
          66% { transform: translate(-20px, 10px) rotate(-1deg); }
        }
        .animate-drift { animation: drift 20s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] text-white shadow-sm transition-transform group-hover:scale-105">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Next<span className="text-[oklch(0.72_0.14_200)]">Tsaraba</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "About", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
            <Button asChild size="sm" className="ml-2 bg-gradient-to-r from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] text-white hover:opacity-90">
              <Link to="/auth">Sign in</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden bg-gradient-to-r from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] text-white">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-20 pb-24 overflow-hidden">
        <AnimatedBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="relative mx-auto max-w-7xl px-6 w-full">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.72_0.14_200)]/30 bg-[oklch(0.72_0.14_200)]/10 px-4 py-1.5 text-xs font-medium text-[oklch(0.72_0.14_200)]">
                <Crown className="h-3.5 w-3.5" />
                Replaces 96 spreadsheet tabs
              </div>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
                Run the{" "}
                <span className="bg-gradient-to-r from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] bg-clip-text text-transparent">
                  factory
                </span>
                <br />
                from one dashboard.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed lg:mx-0 mx-auto">
                Real-time production, sales, inventory, cash reconciliation, and payroll — designed for daily entry on a phone. Built for Next Tsaraba Nigeria Ltd.
              </p>
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] text-white shadow-lg shadow-[oklch(0.72_0.14_200)]/25 hover:shadow-xl hover:shadow-[oklch(0.72_0.14_200)]/30 transition-all hover:scale-[1.02]">
                  <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2">
                  <Link to="/auth" search={{ mode: "signup" } as never}>Create account</Link>
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8">
                {[
                  { icon: Shield, text: "Secure cloud" },
                  { icon: Zap, text: "Real-time" },
                  { icon: TrendingUp, text: "Insights" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-[oklch(0.72_0.14_200)]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative mx-auto h-[500px] w-[400px] animate-drift">
                {/* Phone frame */}
                <div className="absolute inset-0 rounded-[3rem] border-8 border-foreground/10 bg-gradient-to-b from-[oklch(0.2_0.04_240)] to-[oklch(0.15_0.03_240)] shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 rounded-b-2xl bg-foreground/10" />
                  <div className="p-6 pt-10 space-y-4">
                    <div className="h-3 w-24 rounded-full bg-[oklch(0.72_0.14_200)]/60" />
                    <div className="space-y-3">
                      {[60, 80, 45, 70].map((w, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[oklch(0.72_0.14_200)]/20" />
                          <div className={`h-3 rounded-full bg-white/10`} style={{ width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[50, 40, 60, 35].map((h, i) => (
                        <div key={i} className="h-16 rounded-xl bg-gradient-to-b from-[oklch(0.72_0.14_200)]/20 to-transparent" />
                      ))}
                    </div>
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-red-500/40" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-24 rounded-t-full bg-foreground/10" />
                </div>
                {/* Glow behind phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[oklch(0.72_0.14_200)]/10 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="relative border-y border-border/50 bg-gradient-to-r from-[oklch(0.72_0.14_200)]/5 via-transparent to-[oklch(0.42_0.13_235)]/5">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl font-bold tracking-tight md:text-5xl">
                  <span className="bg-gradient-to-r from-[oklch(0.72_0.14_200)] to-[oklch(0.42_0.13_235)] bg-clip-text text-transparent">
                    {value}{suffix}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[oklch(0.72_0.14_200)]">Everything you need</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            One platform for your entire operation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From production floor to cash office — every module works together in real-time.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-[oklch(0.72_0.14_200)]/30 hover:shadow-lg hover:shadow-[oklch(0.72_0.14_200)]/5 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.72_0.14_200)]/20 to-[oklch(0.42_0.13_235)]/20 text-[oklch(0.72_0.14_200)] transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-4 mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.18_0.04_240)] via-[oklch(0.24_0.06_240)] to-[oklch(0.15_0.03_240)] md:mx-8">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[oklch(0.72_0.14_200)]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[oklch(0.42_0.13_235)]/10 blur-3xl" />
        </div>
        <div className="relative px-8 py-20 text-center md:px-20">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Ready to modernise your factory?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Join Next Tsaraba and replace your spreadsheet chaos with a single, real-time dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-[oklch(0.18_0.04_240)] hover:bg-white/90">
              <Link to="/auth">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/auth" search={{ mode: "signup" } as never}>Create account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Droplets className="h-4 w-4 text-[oklch(0.72_0.14_200)]" />
              Next Tsaraba Nigeria Ltd.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Built with care for Nigerian manufacturers</span>
              <span className="hidden md:inline">·</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
