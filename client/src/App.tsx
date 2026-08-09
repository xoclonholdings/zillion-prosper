import { useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { Landmark, LineChart, ShieldCheck } from "lucide-react";

import BudgetPage from "@/pages/budget";
import TradingPage from "@/pages/trading";
import { Button } from "@/components/ui/button";

interface CapitalUser {
  id: string;
}

function LaunchGate() {
  const next = window.location.pathname.startsWith("/trading") ? "/trading" : "/budget";
  const zarOrigin = (import.meta.env.VITE_ZAR_API_URL || "").replace(/\/$/, "");
  const href = zarOrigin
    ? `${zarOrigin}/api/capital/launch?path=${encodeURIComponent(next)}`
    : "#";

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-16 text-white">
      <section className="zar-glass mx-auto max-w-md rounded-3xl p-6 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-cyan-300" />
        <h1 className="mt-4 text-2xl font-semibold">ZILLION Prosper</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Capital access is issued by your authenticated ZCOS identity.
        </p>
        <Button asChild className="zar-button mt-6 w-full rounded-xl">
          <a href={href}>Continue through ZAR</a>
        </Button>
        {!zarOrigin && (
          <p className="mt-3 text-xs text-amber-200">
            VITE_ZAR_API_URL is not configured.
          </p>
        )}
      </section>
    </main>
  );
}

function CapitalHome() {
  const [, navigate] = useLocation();
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 text-white">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">ZILLION Prosper</p>
      <h1 className="mt-2 text-3xl font-semibold">Capital</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Budgeting, investing research, paper trading, market analysis, and governed capital systems.
        Live trading is blocked until separately certified.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <button className="zar-glass rounded-2xl p-5 text-left" onClick={() => navigate("/budget")}>
          <Landmark className="h-6 w-6 text-emerald-300" />
          <div className="mt-4 text-lg font-semibold">Budget & Treasury</div>
          <p className="mt-1 text-sm text-muted-foreground">Dual Reserve allocation and capital readiness.</p>
        </button>
        <button className="zar-glass rounded-2xl p-5 text-left" onClick={() => navigate("/trading")}>
          <LineChart className="h-6 w-6 text-cyan-300" />
          <div className="mt-4 text-lg font-semibold">Trading Intelligence</div>
          <p className="mt-1 text-sm text-muted-foreground">Learning, strategy, validation, paper trading, and governance.</p>
        </button>
      </div>
    </main>
  );
}

function CapitalShell() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#020617]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold tracking-wide text-cyan-200">ZILLION Prosper</Link>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/budget">Budget</Link>
            <Link href="/trading">Trading</Link>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Switch>
          <Route path="/" component={CapitalHome} />
          <Route path="/budget" component={BudgetPage} />
          <Route path="/trading" component={TradingPage} />
          <Route>Not found</Route>
        </Switch>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CapitalUser | null>(null);

  useEffect(() => {
    fetch("/api/capital/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ user: CapitalUser }>;
      })
      .then((payload) => setUser(payload?.user || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#020617]" />;
  if (!user) return <LaunchGate />;
  return <CapitalShell />;
}
