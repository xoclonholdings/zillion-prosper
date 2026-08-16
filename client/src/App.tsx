import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";

import BudgetPage from "@/pages/budget";
import { Button } from "@/components/ui/button";
import {
  CapitalOverview,
  GalaxyDomainPage,
  LiveWorkspace,
  TradeChoicePage,
  ZcosBridgePage,
} from "@/zcos/CapitalDestinations";
import { CapitalWorkspaceShell } from "@/zcos/CapitalWorkspaceShell";
import { InvestWorkspace } from "@/zcos/InvestWorkspace";
import { SimulationWorkspace } from "@/zcos/SimulationWorkspace";
import { ZillionGalaxyPage } from "@/zcos/ZillionGalaxyPage";
import { configuredZarOrigin } from "@/zcos/galaxyManifest";

interface CapitalUser {
  id: string;
}

const PENDING_PATH_KEY = "zillion.pendingPath";

function LaunchGate() {
  const zarOrigin = configuredZarOrigin();
  const href = zarOrigin
    ? zarOrigin + "/api/capital/launch?path=%2F"
    : "#";

  useEffect(() => {
    const pending = window.location.pathname + window.location.search;
    if (pending !== "/") sessionStorage.setItem(PENDING_PATH_KEY, pending);
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#020617] px-4 py-16 text-white">
      <section className="zar-glass mx-auto max-w-md rounded-3xl p-6 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-emerald-300" />
        <h1 className="mt-4 text-2xl font-semibold">ZILLION</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Capital access is issued by your authenticated ZCOS identity.
        </p>
        <Button asChild className="zar-button mt-6 w-full rounded-xl">
          <a href={href}>Continue through ZAR</a>
        </Button>
        {!zarOrigin && (
          <p className="mt-3 text-xs text-amber-200">
            VITE_ZAR_APP_URL is not configured.
          </p>
        )}
      </section>
    </main>
  );
}

function RedirectTo({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
}

function CapitalRouter() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_PATH_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_PATH_KEY);
    if (pending.startsWith("/")) navigate(pending, { replace: true });
  }, [navigate]);

  return (
    <Switch>
      <Route path="/" component={ZillionGalaxyPage} />
      <Route path="/galaxy/zillion" component={ZillionGalaxyPage} />
      <Route path="/domain/:domain" component={GalaxyDomainPage} />
      <Route path="/capital" component={CapitalOverview} />
      <Route path="/capital/chat"><ZcosBridgePage kind="chat" /></Route>
      <Route path="/capital/upload"><ZcosBridgePage kind="upload" /></Route>
      <Route path="/capital/budget">
        <CapitalWorkspaceShell title="Budget"><BudgetPage /></CapitalWorkspaceShell>
      </Route>
      <Route path="/capital/trade" component={TradeChoicePage} />
      <Route path="/capital/trade/simulation" component={SimulationWorkspace} />
      <Route path="/capital/trade/live" component={LiveWorkspace} />
      <Route path="/capital/invest" component={InvestWorkspace} />
      <Route path="/budget"><RedirectTo to="/capital/budget" /></Route>
      <Route path="/trading"><RedirectTo to="/capital/trade" /></Route>
      <Route>
        <CapitalWorkspaceShell title="Not found">
          <p className="text-sm text-white/55">This ZILLION destination does not exist.</p>
        </CapitalWorkspaceShell>
      </Route>
    </Switch>
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

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#02050b] text-sm text-white/45">
        Opening ZILLION…
      </div>
    );
  }
  if (!user) return <LaunchGate />;
  return <CapitalRouter />;
}