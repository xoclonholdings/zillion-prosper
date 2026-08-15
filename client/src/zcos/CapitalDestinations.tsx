import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Landmark,
  LineChart,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

import type { LiveTradingState } from "@shared/trading-training-types";
import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";
import { configuredPortalOrigin, zcosContextUrl, zillionDomainById } from "./galaxyManifest";

type JsonRecord = Record<string, any>;

type BrokerStatus = {
  connected?: boolean;
  mode?: string;
  environment?: string;
  note?: string;
  provider?: string;
};

type Proposal = {
  action?: "no_trade";
  symbol?: string;
  direction?: "long" | "short";
  entry?: number;
  stop?: number;
  target?: number;
  size?: number;
  riskAmount?: number;
  riskReward?: number;
  confidence?: number;
  thesis?: string;
  basis?: string;
  thesisId?: string;
  timeframe?: string;
  setupType?: string;
  reason?: string;
};

async function requestJson(path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(path, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json", ...(init.headers || {}) } : init?.headers,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || body?.message || `Request failed (${response.status}).`);
  return body;
}

function listFrom(payload: any, keys: string[]): JsonRecord[] {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function valueOf(row: JsonRecord, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
}

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function DestinationButton({ title, description, icon: Icon, onClick }: {
  title: string;
  description: string;
  icon: typeof Landmark;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="zar-glass btn-touch rounded-2xl p-5 text-left transition hover:border-emerald-300/25">
      <Icon className="text-emerald-300" size={23} />
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{title}</span>
        <ArrowRight size={17} className="text-white/35" />
      </div>
      <p className="mt-1 text-sm leading-5 text-white/50">{description}</p>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}

export function CapitalOverview() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="CAPITAL Desk">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Desk</p>
        <h2 className="mt-2 text-3xl font-semibold">Capital</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">ZAR operates the financial machinery. You make the decisions.</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <DestinationButton title="Budget" description="Tell ZAR what came in. Approve the plan." icon={Landmark} onClick={() => navigate("/capital/budget")} />
        <DestinationButton title="Trade" description="ZAR finds the setup. You take it or pass." icon={LineChart} onClick={() => navigate("/galaxy/zillion")} />
        <DestinationButton title="Invest" description="ZAR reviews the portfolio and recommends the next move." icon={TrendingUp} onClick={() => navigate("/capital/invest")} />
      </div>
    </CapitalWorkspaceShell>
  );
}

/** Deep-link fallback. Normal Trade mode selection happens in the PROSPER Dock. */
export function TradeChoicePage() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="Trade">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Trade</p>
        <h2 className="mt-2 text-3xl font-semibold">Live or Simulation?</h2>
        <p className="mt-2 text-sm text-white/55">Same ZAR intelligence. Different capital.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DestinationButton title="Live" description="Real connected capital." icon={WalletCards} onClick={() => navigate("/capital/trade/live")} />
          <DestinationButton title="Simulation" description="Practice with isolated simulated capital." icon={LineChart} onClick={() => navigate("/capital/trade/simulation")} />
        </div>
      </div>
    </CapitalWorkspaceShell>
  );
}

export function LiveWorkspace() {
  const [state, setState] = useState<LiveTradingState | null>(null);
  const [webull, setWebull] = useState<BrokerStatus | null>(null);
  const [positions, setPositions] = useState<JsonRecord[]>([]);
  const [orders, setOrders] = useState<JsonRecord[]>([]);
  const [connection, setConnection] = useState<Record<string, string>>({ environment: "production" });
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [livePayload, webullPayload] = await Promise.all([
        requestJson("/api/trading/live"),
        requestJson("/api/trading/webull/status").catch(() => ({ status: null })),
      ]);
      setState(livePayload.state || null);
      setWebull(webullPayload.status || null);
      if (webullPayload.status?.connected) {
        const [p, o] = await Promise.all([
          requestJson("/api/trading/webull/positions").catch(() => ({})),
          requestJson("/api/trading/webull/orders").catch(() => ({})),
        ]);
        setPositions(listFrom(p, ["positions", "data"]));
        setOrders(listFrom(o, ["orders", "data"]));
      } else {
        setPositions([]);
        setOrders([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not read Live status.");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function connectBroker(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestJson("/api/trading/webull/credentials", {
        method: "POST",
        body: JSON.stringify({ ...connection, environment: "production" }),
      });
      await requestJson("/api/trading/webull/test", { method: "POST", body: "{}" });
      setConnection({ environment: "production" });
      setNotice("Broker connected. ZAR is checking the account and risk requirements.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not connect Webull.");
    } finally {
      setBusy(false);
    }
  }

  async function armRiskControls() {
    setBusy(true);
    setError(null);
    try {
      const payload = await requestJson("/api/trading/live/kill-switch", {
        method: "POST",
        body: JSON.stringify({ armed: true }),
      });
      setState(payload.state || null);
      setNotice("Risk controls are armed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not arm the risk controls.");
    } finally {
      setBusy(false);
    }
  }

  async function findTrade() {
    setBusy(true);
    setError(null);
    setNotice(null);
    setProposal(null);
    try {
      const body = await requestJson("/api/trading/webull/propose", {
        method: "POST",
        body: JSON.stringify({ asset: "stock", market: "US", directionPreference: "auto" }),
      });
      setProposal(body);
      if (body.action === "no_trade") setNotice(body.reason || "ZAR did not find a setup worth taking right now.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not find a Live setup right now.");
    } finally {
      setBusy(false);
    }
  }

  async function takeTrade() {
    if (!proposal?.symbol || !proposal.direction || proposal.entry === undefined || proposal.stop === undefined || proposal.target === undefined) {
      setError("ZAR's proposal is missing required order information.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = await requestJson("/api/trading/webull/order", {
        method: "POST",
        body: JSON.stringify({
          thesisId: proposal.thesisId,
          market: "US",
          assetClass: "stock",
          symbol: proposal.symbol,
          direction: proposal.direction,
          entry: proposal.entry,
          stop: proposal.stop,
          target: proposal.target,
          size: proposal.size || 1,
          riskAmount: proposal.riskAmount || Math.abs(proposal.entry - proposal.stop) * (proposal.size || 1),
          entryReason: proposal.thesis || proposal.basis || "ZAR Live proposal.",
        }),
      });
      setNotice(payload.webullOrder?.message || `${proposal.symbol} was accepted by the broker.`);
      setProposal(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not submit that Live order.");
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(webull?.connected);
  const blockers = state?.blockers || [];
  const needsRiskArm = connected && !state?.config?.killSwitchArmed;

  return (
    <CapitalWorkspaceShell title="Live Trading">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Live</p>
            <h2 className="mt-1 text-3xl font-semibold">ZAR finds it. You decide.</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Real money is only used after the account and safeguards are ready.</p>
          </div>
          <button type="button" onClick={() => void refresh()} className="btn-touch rounded-full border border-white/10 p-3 text-white/60" aria-label="Refresh Live"><RefreshCw size={16} /></button>
        </div>

        {error && <div className="mb-3 rounded-xl border border-red-300/20 bg-red-300/[0.05] p-3 text-sm text-red-200">{error}</div>}
        {notice && <div className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-3 text-sm text-emerald-100">{notice}</div>}

        {!connected ? (
          <section className="zar-glass rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><KeyRound size={17} /> I need your brokerage connection first.</div>
            <h3 className="mt-2 text-2xl font-semibold">Connect Webull</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">Give ZAR the connection credentials. ZAR checks the account before anything can trade.</p>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={connectBroker}>
              <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="App key" value={connection.appKey || ""} onChange={(e) => setConnection((v) => ({ ...v, appKey: e.target.value }))} required />
              <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="App secret" value={connection.appSecret || ""} onChange={(e) => setConnection((v) => ({ ...v, appSecret: e.target.value }))} required />
              <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Account ID (if supplied)" value={connection.accountId || ""} onChange={(e) => setConnection((v) => ({ ...v, accountId: e.target.value }))} />
              <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Access token (if supplied)" value={connection.accessToken || ""} onChange={(e) => setConnection((v) => ({ ...v, accessToken: e.target.value }))} />
              <button disabled={busy} className="btn-touch sm:col-span-2 rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Connecting…" : "Connect"}</button>
            </form>
          </section>
        ) : blockers.length > 0 && !state?.canExecute ? (
          <section className="zar-glass rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><ShieldCheck size={17} /> I need one more thing before Live trading.</div>
            <h3 className="mt-2 text-2xl font-semibold">{needsRiskArm ? "Turn on your risk controls." : "Finish the remaining account requirement."}</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">ZAR keeps the technical checklist underneath. You only see what actually needs your attention.</p>
            {needsRiskArm ? (
              <button type="button" disabled={busy} onClick={() => void armRiskControls()} className="btn-touch mt-5 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">Turn on risk controls</button>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">{blockers[0]}</div>
            )}
          </section>
        ) : (
          <section className="zar-glass rounded-3xl p-6">
            {!proposal || proposal.action === "no_trade" ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10"><Sparkles size={22} className="text-emerald-200" /></div>
                <h3 className="mt-4 text-2xl font-semibold">Want me to find a trade?</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">I’ll scan, build the setup, size the risk, and bring you one decision.</p>
                <button type="button" disabled={busy} onClick={() => void findTrade()} className="btn-touch mt-5 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Looking…" : "Find one"}</button>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">ZAR found a setup</p>
                <h3 className="mt-1 text-3xl font-semibold">{proposal.symbol} · {proposal.direction === "short" ? "Sell" : "Buy"}</h3>
                <p className="mt-4 text-sm leading-6 text-white/65">{proposal.thesis || proposal.basis || "This setup passed the current Live checks."}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Entry" value={money(proposal.entry)} />
                  <Metric label="Max risk" value={money(proposal.riskAmount)} />
                  <Metric label="Target" value={money(proposal.target)} />
                  <Metric label="R / R" value={proposal.riskReward ? `${proposal.riskReward}:1` : "—"} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" disabled={busy} onClick={() => void takeTrade()} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-bold text-slate-950 disabled:opacity-50"><Check size={18} /> Take Trade</button>
                  <button type="button" disabled={busy} onClick={() => { setProposal(null); setNotice("Passed. No order was sent."); }} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold text-white/75"><X size={18} /> Pass</button>
                </div>
              </div>
            )}
          </section>
        )}

        <button type="button" onClick={() => setShowDetails((v) => !v)} className="btn-touch mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">
          <span>Details</span>{showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showDetails && (
          <section className="zar-glass mt-3 rounded-2xl p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Provider" value={connected ? "Webull" : "Not connected"} />
              <Metric label="Open positions" value={String(positions.length)} />
              <Metric label="Recent orders" value={String(orders.length)} />
            </div>
            <div className="mt-5 space-y-2">
              {positions.slice(0, 5).map((position, index) => (
                <div key={valueOf(position, ["id", "positionId", "symbol"], String(index))} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <span className="font-semibold">{valueOf(position, ["symbol", "ticker"])}</span>
                  <span className="text-white/50">Qty {valueOf(position, ["quantity", "qty", "position"])}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </CapitalWorkspaceShell>
  );
}

export function InvestWorkspace() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<BrokerStatus | null>(null);
  const [positions, setPositions] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  async function loadPortfolio() {
    setLoading(true);
    setError(null);
    try {
      const statusPayload = await requestJson("/api/trading/webull/status");
      const nextStatus = statusPayload.status || null;
      setStatus(nextStatus);
      if (nextStatus?.connected) {
        const payload = await requestJson("/api/trading/webull/positions");
        setPositions(listFrom(payload, ["positions", "data"]));
      } else {
        setPositions([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not read your investments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPortfolio(); }, []);

  async function reviewPortfolio() {
    setBusy(true);
    setError(null);
    try {
      const compact = positions.slice(0, 25).map((p) => ({
        symbol: valueOf(p, ["symbol", "ticker"]),
        quantity: valueOf(p, ["quantity", "qty", "position"]),
        marketValue: valueOf(p, ["marketValue", "value", "currentValue"]),
        pnl: valueOf(p, ["unrealizedPnl", "pnl", "profitLoss"]),
      }));
      const payload = await requestJson("/api/capital/agent", {
        method: "POST",
        body: JSON.stringify({
          task: `Review these verified current holdings and give me ONE clear long-term investing action. Keep it simple. If a fact needed to make the recommendation is missing, ask me only for that missing information instead of guessing. Holdings: ${JSON.stringify(compact)}`,
        }),
      });
      setRecommendation(payload.message || "ZAR did not return a recommendation.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not review the portfolio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CapitalWorkspaceShell title="Invest">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Invest</p>
            <h2 className="mt-1 text-3xl font-semibold">ZAR reviews. You decide.</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Long-term capital without making you operate a portfolio terminal.</p>
          </div>
          <button type="button" onClick={() => void loadPortfolio()} className="btn-touch rounded-full border border-white/10 p-3 text-white/60" aria-label="Refresh investments"><RefreshCw size={16} /></button>
        </div>

        {error && <div className="mb-3 rounded-xl border border-red-300/20 bg-red-300/[0.05] p-3 text-sm text-red-200">{error}</div>}

        {loading ? (
          <section className="zar-glass rounded-3xl p-6 text-sm text-white/55">ZAR is checking your holdings…</section>
        ) : !status?.connected ? (
          <section className="zar-glass rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><WalletCards size={17} /> I need to know what you own first.</div>
            <h3 className="mt-2 text-2xl font-semibold">Give ZAR a holdings source.</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">Connect the brokerage account or upload a current statement. ZAR should not guess your portfolio.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate("/capital/trade/live")} className="btn-touch rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950">Connect account</button>
              <button type="button" onClick={() => navigate("/capital/upload")} className="btn-touch rounded-xl border border-white/15 py-3 text-sm font-semibold">Upload statement</button>
            </div>
          </section>
        ) : positions.length === 0 ? (
          <section className="zar-glass rounded-3xl p-6">
            <h3 className="text-2xl font-semibold">I’m connected, but I don’t see holdings yet.</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">If this account should contain investments, upload a current statement or refresh after the provider updates.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => void loadPortfolio()} className="btn-touch rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950">Refresh</button>
              <button type="button" onClick={() => navigate("/capital/upload")} className="btn-touch rounded-xl border border-white/15 py-3 text-sm font-semibold">Upload statement</button>
            </div>
          </section>
        ) : !recommendation ? (
          <section className="zar-glass rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10"><Sparkles size={22} className="text-emerald-200" /></div>
            <h3 className="mt-4 text-2xl font-semibold">Want me to review your portfolio?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">I’ll look at what you actually own and bring you one clear next move.</p>
            <button type="button" disabled={busy} onClick={() => void reviewPortfolio()} className="btn-touch mt-5 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Reviewing…" : "Review it"}</button>
          </section>
        ) : (
          <section className="zar-glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">ZAR recommends</p>
            <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-white/75">{recommendation}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate("/capital/chat")} className="btn-touch rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950">Use this plan</button>
              <button type="button" onClick={() => setRecommendation(null)} className="btn-touch rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/75">Pass</button>
            </div>
          </section>
        )}

        {positions.length > 0 && (
          <>
            <button type="button" onClick={() => setShowDetails((v) => !v)} className="btn-touch mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">
              <span>Holdings</span>{showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showDetails && (
              <section className="zar-glass mt-3 rounded-2xl p-5">
                <div className="space-y-2">
                  {positions.map((position, index) => (
                    <div key={valueOf(position, ["id", "positionId", "symbol"], String(index))} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <div><div className="font-semibold">{valueOf(position, ["symbol", "ticker"])}</div><div className="text-white/40">Qty {valueOf(position, ["quantity", "qty", "position"])}</div></div>
                      <div className="text-right"><div>{valueOf(position, ["marketValue", "value", "currentValue"])}</div><div className="text-white/40">{valueOf(position, ["unrealizedPnl", "pnl", "profitLoss"])}</div></div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </CapitalWorkspaceShell>
  );
}

export function ZcosBridgePage({ kind }: { kind: "chat" | "upload" }) {
  const destination = useMemo(
    () => kind === "chat" ? zcosContextUrl("/chat", { workspace: "finance" }) : zcosContextUrl("/nexys", { dock: "upload" }),
    [kind],
  );

  useEffect(() => { if (destination) window.location.assign(destination); }, [destination]);
  const Icon = kind === "chat" ? MessageCircle : Upload;

  return (
    <CapitalWorkspaceShell title={kind === "chat" ? "Chat with ZAR" : "Upload"}>
      <section className="zar-glass mx-auto max-w-md rounded-2xl p-6 text-center">
        <Icon className="mx-auto text-emerald-300" size={28} />
        <h2 className="mt-4 text-xl font-semibold">{destination ? (kind === "chat" ? "Opening ZAR" : "Opening Upload") : "ZCOS connection needed"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">{kind === "chat" ? "ZAR keeps ZILLION and CAPITAL as the active context." : "Files use the canonical ZCOS intake so ZAR can ask for and process what the task needs."}</p>
        {destination ? <a className="btn-touch mt-5 inline-flex items-center rounded-full border border-emerald-300/25 px-4 text-sm text-emerald-100" href={destination}>Continue</a> : <p className="mt-4 text-sm text-amber-200">ZAR needs the ZCOS application URL configured before this action can continue.</p>}
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
  const external = domain?.id === "portal" ? portal || null : zcosContextUrl(externalPath);

  useEffect(() => { if (domain && external) window.location.assign(external); }, [domain?.id, external]);

  if (!domain) {
    return <CapitalWorkspaceShell title="Domain unavailable"><p className="text-sm text-white/55">That ZILLION domain does not exist.</p></CapitalWorkspaceShell>;
  }

  return (
    <CapitalWorkspaceShell title={domain.title}>
      <section className="zar-glass mx-auto max-w-xl rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: domain.color }}>{domain.authority} authority</div>
        <h2 className="mt-2 text-3xl font-semibold">{domain.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">{external ? "Opening the shared ZCOS authority in ZILLION context…" : domain.summary}</p>
        {!external && <p className="mt-5 text-sm text-amber-200">ZAR needs the ZCOS portal URL configured before this domain can open.</p>}
      </section>
    </CapitalWorkspaceShell>
  );
}
