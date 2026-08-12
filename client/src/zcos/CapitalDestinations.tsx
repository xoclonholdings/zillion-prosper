import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Landmark,
  LineChart,
  Lock,
  MessageCircle,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

import type { LiveTradingState } from "@shared/trading-training-types";
import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";
import {
  configuredPortalOrigin,
  zcosContextUrl,
  zillionDomainById,
} from "./galaxyManifest";

function DestinationButton({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: typeof Landmark;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="zar-glass btn-touch rounded-2xl p-5 text-left transition hover:border-emerald-300/25"
    >
      <Icon className="text-emerald-300" size={23} />
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{title}</span>
        <ArrowRight size={17} className="text-white/35" />
      </div>
      <p className="mt-1 text-sm leading-5 text-white/50">{description}</p>
    </button>
  );
}

export function CapitalOverview() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="CAPITAL Desk">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Desk</p>
        <h2 className="mt-2 text-3xl font-semibold">Capital</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
          Budget, practice or trade, and manage long-term capital from one ZILLION workspace.
        </p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <DestinationButton
          title="Budget"
          description="Plan income, reserves, and allocations."
          icon={Landmark}
          onClick={() => navigate("/capital/budget")}
        />
        <DestinationButton
          title="Trade"
          description="Choose real-capital Live or isolated Simulation."
          icon={LineChart}
          onClick={() => navigate("/capital/trade")}
        />
        <DestinationButton
          title="Invest"
          description="Long-term capital and holdings."
          icon={TrendingUp}
          onClick={() => navigate("/capital/invest")}
        />
      </div>
    </CapitalWorkspaceShell>
  );
}

export function TradeChoicePage() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="Trade">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Environment</p>
        <h2 className="mt-2 text-3xl font-semibold">Choose how you trade</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DestinationButton
            title="Live"
            description="Real capital only. Execution remains blocked until certified."
            icon={Lock}
            onClick={() => navigate("/capital/trade/live")}
          />
          <DestinationButton
            title="Simulation"
            description="Practice and test with isolated simulated capital."
            icon={LineChart}
            onClick={() => navigate("/capital/trade/simulation")}
          />
        </div>
      </div>
    </CapitalWorkspaceShell>
  );
}

const LIVE_TABS = ["Account", "Markets", "Trade", "Positions", "Performance"] as const;

export function LiveWorkspace() {
  const [state, setState] = useState<LiveTradingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<(typeof LIVE_TABS)[number]>("Account");

  useEffect(() => {
    fetch("/api/trading/live", { credentials: "include" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error || "Live status is unavailable.");
        setState(body.state);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Live status is unavailable."));
  }, []);

  const blocked = !state?.canExecute;
  return (
    <CapitalWorkspaceShell title="Live Trading">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
          <Lock size={17} /> Live trading isn't ready yet.
        </div>
        <p className="mt-1 text-sm text-amber-100/65">Continue in Simulation.</p>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Live workspace">
        {LIVE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={"btn-touch whitespace-nowrap rounded-full border px-4 text-xs " + (
              active === tab
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 text-white/55"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <section className="zar-glass mt-2 rounded-2xl p-5">
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : !state ? (
          <p className="text-sm text-white/50">Checking Live readiness…</p>
        ) : active === "Account" ? (
          <div className="space-y-3">
            <div className="text-sm"><span className="text-white/45">Provider</span><br />{state.brokerLabel}</div>
            <div className="text-sm"><span className="text-white/45">Status</span><br />{blocked ? "Blocked" : "Ready"}</div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-white/55">
            {active} will use verified real-account data only after a certified Live provider is active. No simulated data is shown here.
          </p>
        )}
      </section>
    </CapitalWorkspaceShell>
  );
}

export function InvestWorkspace() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="Invest">
      <section className="zar-glass mx-auto max-w-xl rounded-2xl p-6 text-center">
        <TrendingUp className="mx-auto text-emerald-300" size={30} />
        <h2 className="mt-4 text-2xl font-semibold">Investing</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          No holdings provider or canonical portfolio store is connected yet. ZILLION will not invent holdings, balances, or transactions.
        </p>
        <button
          type="button"
          onClick={() => navigate("/domain/knowledge")}
          className="btn-touch mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm text-emerald-100"
        >
          <BookOpen size={16} /> Open investment knowledge
        </button>
      </section>
    </CapitalWorkspaceShell>
  );
}

export function ZcosBridgePage({ kind }: { kind: "chat" | "upload" }) {
  const destination = useMemo(
    () => kind === "chat"
      ? zcosContextUrl("/chat", { workspace: "finance" })
      : zcosContextUrl("/nexys", { dock: "upload" }),
    [kind],
  );

  useEffect(() => {
    if (destination) window.location.assign(destination);
  }, [destination]);

  const Icon = kind === "chat" ? MessageCircle : Upload;
  return (
    <CapitalWorkspaceShell title={kind === "chat" ? "Chat with ZAR" : "Upload"}>
      <section className="zar-glass mx-auto max-w-md rounded-2xl p-6 text-center">
        <Icon className="mx-auto text-emerald-300" size={28} />
        <h2 className="mt-4 text-xl font-semibold">
          {destination ? (kind === "chat" ? "Opening ZAR" : "Opening ZCOS Upload") : "ZCOS connection unavailable"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {kind === "chat"
            ? "ZAR remains the same operator, with ZILLION and CAPITAL supplied as active context."
            : "Files continue through the canonical ZCOS intake; ZILLION does not create a second upload pipeline."}
        </p>
        {destination && (
          <a className="btn-touch mt-5 inline-flex items-center rounded-full border border-emerald-300/25 px-4 text-sm text-emerald-100" href={destination}>
            Continue
          </a>
        )}
      </section>
    </CapitalWorkspaceShell>
  );
}

export function GalaxyDomainPage() {
  const params = useParams<{ domain?: string }>();
  const domain = zillionDomainById(params.domain);
  const portal = configuredPortalOrigin();
  const externalPath = domain?.id === "identity"
    ? "/identity"
    : domain?.id === "memory"
      ? "/nexys/memory"
      : domain?.id === "knowledge"
        ? "/knowledge"
        : domain?.id === "apps"
          ? "/nexys/apps"
          : domain?.id === "settings"
            ? "/settings"
            : "/";
  const external = domain?.id === "portal"
    ? portal || null
    : zcosContextUrl(externalPath);

  if (!domain) {
    return (
      <CapitalWorkspaceShell title="Domain unavailable">
        <p className="text-sm text-white/55">That ZILLION domain does not exist.</p>
      </CapitalWorkspaceShell>
    );
  }

  return (
    <CapitalWorkspaceShell title={domain.title}>
      <section className="zar-glass mx-auto max-w-xl rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: domain.color }}>
          {domain.authority} authority
        </div>
        <h2 className="mt-2 text-3xl font-semibold">{domain.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">{domain.summary}</p>
        {external ? (
          <a
            href={external}
            className="btn-touch mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 text-sm"
          >
            Open in ZCOS <ArrowRight size={15} />
          </a>
        ) : (
          <p className="mt-5 text-sm text-amber-200">The ZCOS portal URL is not configured.</p>
        )}
      </section>
    </CapitalWorkspaceShell>
  );
}
