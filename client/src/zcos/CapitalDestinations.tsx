import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Landmark,
  LineChart,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  WalletCards,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

import type { LiveTradingState } from "@shared/trading-training-types";
import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";
import {
  configuredPortalOrigin,
  zcosContextUrl,
  zillionDomainById,
} from "./galaxyManifest";

type JsonRecord = Record<string, any>;

type BrokerStatus = {
  connected?: boolean;
  mode?: string;
  environment?: string;
  note?: string;
  provider?: string;
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
          Your working financial space. PROSPER stays in control of Budget, Trade, and Invest while ZAR asks for whatever information or connection is needed to complete the task.
        </p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <DestinationButton
          title="Budget"
          description="Plan income, reserves, obligations, and allocations."
          icon={Landmark}
          onClick={() => navigate("/capital/budget")}
        />
        <DestinationButton
          title="Trade"
          description="Use the PROSPER Trade control to enter Live or Simulation."
          icon={LineChart}
          onClick={() => navigate("/galaxy/zillion")}
        />
        <DestinationButton
          title="Invest"
          description="Review real connected holdings and long-term capital."
          icon={TrendingUp}
          onClick={() => navigate("/capital/invest")}
        />
      </div>
    </CapitalWorkspaceShell>
  );
}

/** Deep-link fallback. Normal Trade mode selection happens inside the PROSPER Dock. */
export function TradeChoicePage() {
  const [, navigate] = useLocation();
  return (
    <CapitalWorkspaceShell title="Trade">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Trade</p>
        <h2 className="mt-2 text-3xl font-semibold">Live or Simulation</h2>
        <p className="mt-2 text-sm text-white/55">Choose an environment. The same Trading Intelligence supports both; only the capital and execution path change.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DestinationButton
            title="Live"
            description="Connect a real broker, review real account data, and prepare governed orders."
            icon={WalletCards}
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

type LiveTab = (typeof LIVE_TABS)[number];

export function LiveWorkspace() {
  const [state, setState] = useState<LiveTradingState | null>(null);
  const [webull, setWebull] = useState<BrokerStatus | null>(null);
  const [tradovate, setTradovate] = useState<BrokerStatus | null>(null);
  const [accounts, setAccounts] = useState<JsonRecord[]>([]);
  const [positions, setPositions] = useState<JsonRecord[]>([]);
  const [orders, setOrders] = useState<JsonRecord[]>([]);
  const [active, setActive] = useState<LiveTab>("Account");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<"webull" | "tradovate">("webull");
  const [connection, setConnection] = useState<Record<string, string>>({ environment: "production" });
  const [symbol, setSymbol] = useState("AAPL");
  const [quote, setQuote] = useState<any>(null);
  const [trade, setTrade] = useState({
    symbol: "",
    direction: "long",
    entry: "",
    stop: "",
    target: "",
    size: "1",
    riskAmount: "",
    entryReason: "",
  });
  const [tradeResult, setTradeResult] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [livePayload, webullPayload, tradovatePayload] = await Promise.all([
        requestJson("/api/trading/live"),
        requestJson("/api/trading/webull/status").catch(() => ({ status: null })),
        requestJson("/api/trading/tradovate/status").catch(() => ({ status: null })),
      ]);
      setState(livePayload.state);
      setWebull(webullPayload.status || null);
      setTradovate(tradovatePayload.status || null);
      if (webullPayload.status?.connected) {
        const [a, p, o] = await Promise.all([
          requestJson("/api/trading/webull/accounts").catch(() => ({})),
          requestJson("/api/trading/webull/positions").catch(() => ({})),
          requestJson("/api/trading/webull/orders").catch(() => ({})),
        ]);
        setAccounts(listFrom(a, ["accounts", "data"]));
        setPositions(listFrom(p, ["positions", "data"]));
        setOrders(listFrom(o, ["orders", "data"]));
      } else {
        setAccounts([]);
        setPositions([]);
        setOrders([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Live account information is unavailable.");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function connectBroker(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (provider === "webull") {
        await requestJson("/api/trading/webull/credentials", {
          method: "POST",
          body: JSON.stringify({ ...connection, environment: connection.environment || "production" }),
        });
        await requestJson("/api/trading/webull/test", { method: "POST", body: "{}" });
      } else {
        await requestJson("/api/trading/tradovate/credentials", {
          method: "POST",
          body: JSON.stringify({ ...connection, environment: connection.environment === "production" ? "live" : connection.environment || "demo" }),
        });
      }
      setConnection({ environment: provider === "webull" ? "production" : "live" });
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not connect that broker yet.");
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
      setState(payload.state);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Risk controls could not be armed.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupQuote(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = await requestJson(`/api/trading/market-data/quote?symbol=${encodeURIComponent(symbol)}&asset=stock`);
      setQuote(payload.quote || null);
      if (!payload.quote) setError(payload.note || "ZAR needs a reachable market-data source for this symbol.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Quote unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLiveTrade(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setTradeResult(null);
    try {
      const payload = await requestJson("/api/trading/webull/order", {
        method: "POST",
        body: JSON.stringify({
          market: "US",
          assetClass: "stock",
          symbol: trade.symbol,
          direction: trade.direction,
          entry: Number(trade.entry),
          stop: Number(trade.stop),
          target: Number(trade.target),
          size: Number(trade.size),
          riskAmount: Number(trade.riskAmount),
          entryReason: trade.entryReason,
        }),
      });
      setTradeResult(payload.webullOrder?.message || "Broker accepted the order.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not submit this order.");
    } finally {
      setBusy(false);
    }
  }

  const brokerConnected = Boolean(webull?.connected || tradovate?.connected);
  const setupNeeded = state?.blockers || [];

  return (
    <CapitalWorkspaceShell title="Live Trading">
      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
          <ShieldCheck size={17} /> ZAR will ask for each missing requirement before real capital is used.
        </div>
        <p className="mt-1 text-sm text-white/55">
          {state?.canExecute ? "Live execution is ready." : "Complete the requested setup below; nothing is silently assumed."}
        </p>
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

      {error && <div className="mt-2 rounded-xl border border-red-300/20 bg-red-300/[0.05] p-3 text-sm text-red-200">{error}</div>}

      {active === "Account" && (
        <section className="zar-glass mt-2 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">Live account</div>
              <h2 className="mt-1 text-xl font-semibold">{brokerConnected ? "Connected" : "ZAR needs a broker connection"}</h2>
            </div>
            <button type="button" onClick={() => void refresh()} className="btn-touch rounded-full border border-white/10 px-3 text-xs text-white/65"><RefreshCw size={14} /></button>
          </div>

          {!brokerConnected ? (
            <form className="mt-5 space-y-3" onSubmit={connectBroker}>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setProvider("webull"); setConnection({ environment: "production" }); }} className={`btn-touch rounded-xl border p-3 text-sm ${provider === "webull" ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10"}`}>Webull</button>
                <button type="button" onClick={() => { setProvider("tradovate"); setConnection({ environment: "live" }); }} className={`btn-touch rounded-xl border p-3 text-sm ${provider === "tradovate" ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10"}`}>Tradovate</button>
              </div>
              <p className="text-sm text-white/55">Tell ZAR which broker you use, then provide only the connection fields that broker requires.</p>
              {provider === "webull" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="App key" value={connection.appKey || ""} onChange={(e) => setConnection((v) => ({ ...v, appKey: e.target.value }))} required />
                  <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="App secret" value={connection.appSecret || ""} onChange={(e) => setConnection((v) => ({ ...v, appSecret: e.target.value }))} required />
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Account ID (if required)" value={connection.accountId || ""} onChange={(e) => setConnection((v) => ({ ...v, accountId: e.target.value }))} />
                  <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Access token (if supplied)" value={connection.accessToken || ""} onChange={(e) => setConnection((v) => ({ ...v, accessToken: e.target.value }))} />
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Username" value={connection.username || ""} onChange={(e) => setConnection((v) => ({ ...v, username: e.target.value }))} required />
                  <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Password" value={connection.password || ""} onChange={(e) => setConnection((v) => ({ ...v, password: e.target.value }))} required />
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="App ID" value={connection.appId || ""} onChange={(e) => setConnection((v) => ({ ...v, appId: e.target.value }))} />
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="CID" value={connection.cid || ""} onChange={(e) => setConnection((v) => ({ ...v, cid: e.target.value }))} />
                  <input type="password" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Secret" value={connection.sec || ""} onChange={(e) => setConnection((v) => ({ ...v, sec: e.target.value }))} />
                  <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Device ID" value={connection.deviceId || ""} onChange={(e) => setConnection((v) => ({ ...v, deviceId: e.target.value }))} />
                </div>
              )}
              <button disabled={busy} className="btn-touch inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 text-sm font-semibold text-black"><KeyRound size={15} /> {busy ? "Connecting…" : `Connect ${provider === "webull" ? "Webull" : "Tradovate"}`}</button>
            </form>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-4 text-sm"><span className="text-white/40">Provider</span><br />{state?.brokerLabel || (webull?.connected ? "Webull" : "Tradovate")}</div>
              <div className="rounded-xl border border-white/10 p-4 text-sm"><span className="text-white/40">Execution state</span><br />{state?.canExecute ? "Ready" : "Setup in progress"}</div>
              {accounts.slice(0, 4).map((account, index) => (
                <div key={valueOf(account, ["id", "accountId"], String(index))} className="rounded-xl border border-white/10 p-4 text-sm">
                  <span className="text-white/40">Account</span><br />{valueOf(account, ["name", "accountName", "accountId", "id"])}
                </div>
              ))}
            </div>
          )}

          {setupNeeded.length > 0 && brokerConnected && (
            <div className="mt-5 rounded-xl border border-white/10 p-4">
              <div className="text-sm font-semibold">What ZAR still needs</div>
              <ul className="mt-2 space-y-1 text-sm text-white/55">{setupNeeded.map((item) => <li key={item}>• {item}</li>)}</ul>
              {!state?.config?.killSwitchArmed && (
                <button type="button" disabled={busy} onClick={() => void armRiskControls()} className="btn-touch mt-4 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm text-emerald-100">Arm risk controls</button>
              )}
            </div>
          )}
        </section>
      )}

      {active === "Markets" && (
        <section className="zar-glass mt-2 rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Markets</h2>
          <form onSubmit={lookupQuote} className="mt-4 flex gap-2">
            <input className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol" />
            <button disabled={busy} className="btn-touch rounded-xl border border-emerald-300/25 px-4 text-sm"><Search size={16} /></button>
          </form>
          {quote && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Symbol</div><div className="mt-1 font-semibold">{quote.symbol || symbol}</div></div>
              <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Price</div><div className="mt-1 font-semibold">{quote.price}</div></div>
              <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Source</div><div className="mt-1 text-sm">{quote.source || "Market feed"}</div></div>
            </div>
          )}
        </section>
      )}

      {active === "Trade" && (
        <section className="zar-glass mt-2 rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Trade</h2>
          {!webull?.connected ? (
            <p className="mt-3 text-sm text-white/55">ZAR needs a connected production Webull account before it can submit this Live order. Open Account first.</p>
          ) : (
            <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={submitLiveTrade}>
              <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm uppercase" placeholder="Symbol" value={trade.symbol} onChange={(e) => setTrade((v) => ({ ...v, symbol: e.target.value.toUpperCase() }))} required />
              <select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" value={trade.direction} onChange={(e) => setTrade((v) => ({ ...v, direction: e.target.value }))}><option value="long">Buy / Long</option><option value="short">Sell / Short</option></select>
              <input type="number" step="any" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Entry price" value={trade.entry} onChange={(e) => setTrade((v) => ({ ...v, entry: e.target.value }))} required />
              <input type="number" step="any" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Stop" value={trade.stop} onChange={(e) => setTrade((v) => ({ ...v, stop: e.target.value }))} required />
              <input type="number" step="any" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Target" value={trade.target} onChange={(e) => setTrade((v) => ({ ...v, target: e.target.value }))} required />
              <input type="number" step="any" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Quantity" value={trade.size} onChange={(e) => setTrade((v) => ({ ...v, size: e.target.value }))} required />
              <input type="number" step="any" className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Risk amount" value={trade.riskAmount} onChange={(e) => setTrade((v) => ({ ...v, riskAmount: e.target.value }))} required />
              <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm" placeholder="Why are you taking this trade?" value={trade.entryReason} onChange={(e) => setTrade((v) => ({ ...v, entryReason: e.target.value }))} required />
              <div className="sm:col-span-2 mt-2">
                <button disabled={busy} className="btn-touch rounded-full bg-emerald-300 px-4 text-sm font-semibold text-black">{busy ? "Checking…" : "Review & submit to broker"}</button>
                <p className="mt-2 text-xs text-white/40">ZAR sends nothing until the exact order passes the live governance gates and this explicit submit action succeeds.</p>
              </div>
            </form>
          )}
          {tradeResult && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-3 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline" size={15} />{tradeResult}</div>}
        </section>
      )}

      {active === "Positions" && (
        <section className="zar-glass mt-2 rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Positions</h2>
          {!webull?.connected ? <p className="mt-3 text-sm text-white/55">Connect your broker in Account and ZAR will load the real positions here.</p> : positions.length === 0 ? <p className="mt-3 text-sm text-white/55">No open positions were returned by the connected account.</p> : (
            <div className="mt-4 space-y-2">{positions.map((position, index) => (
              <div key={valueOf(position, ["id", "positionId", "symbol"], String(index))} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4 text-sm">
                <div><div className="font-semibold">{valueOf(position, ["symbol", "ticker"])}</div><div className="text-white/40">Qty {valueOf(position, ["quantity", "qty", "position"] )}</div></div>
                <div className="text-right"><div>{valueOf(position, ["marketValue", "value", "currentValue"])}</div><div className="text-white/40">{valueOf(position, ["unrealizedPnl", "pnl", "profitLoss"])}</div></div>
              </div>
            ))}</div>
          )}
        </section>
      )}

      {active === "Performance" && (
        <section className="zar-glass mt-2 rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Performance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Open positions</div><div className="mt-1 text-2xl font-semibold">{positions.length}</div></div>
            <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Orders loaded</div><div className="mt-1 text-2xl font-semibold">{orders.length}</div></div>
            <div className="rounded-xl border border-white/10 p-4"><div className="text-xs text-white/40">Execution</div><div className="mt-1 text-sm font-semibold">{state?.canExecute ? "Ready" : "Setup needed"}</div></div>
          </div>
        </section>
      )}
    </CapitalWorkspaceShell>
  );
}

export function InvestWorkspace() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<BrokerStatus | null>(null);
  const [positions, setPositions] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(reason instanceof Error ? reason.message : "Portfolio data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPortfolio(); }, []);

  return (
    <CapitalWorkspaceShell title="Invest">
      <section className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Long-term capital</p>
        <h2 className="mt-2 text-3xl font-semibold">Investing</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">ZAR uses verified account data when it exists and asks you for a connection or source when it does not.</p>
      </section>

      {error && <div className="mb-3 rounded-xl border border-red-300/20 bg-red-300/[0.05] p-3 text-sm text-red-200">{error}</div>}

      {loading ? (
        <section className="zar-glass rounded-2xl p-5 text-sm text-white/55">Loading connected investments…</section>
      ) : !status?.connected ? (
        <section className="zar-glass rounded-2xl p-6">
          <WalletCards className="text-emerald-300" size={28} />
          <h3 className="mt-4 text-xl font-semibold">ZAR needs a source for your holdings.</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">Connect the brokerage account that holds your investments, or upload a current statement for ZAR to process through the canonical ZCOS intake.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate("/capital/trade/live")} className="btn-touch rounded-full bg-emerald-300 px-4 text-sm font-semibold text-black">Connect brokerage</button>
            <button type="button" onClick={() => navigate("/capital/upload")} className="btn-touch rounded-full border border-white/15 px-4 text-sm">Upload statement</button>
          </div>
        </section>
      ) : positions.length === 0 ? (
        <section className="zar-glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold">Connected. No holdings returned.</h3>
          <p className="mt-2 text-sm text-white/55">ZAR found the brokerage connection but the provider returned no current positions. Refresh after the account has holdings or use Upload to provide another source.</p>
          <button type="button" onClick={() => void loadPortfolio()} className="btn-touch mt-4 rounded-full border border-white/15 px-4 text-sm">Refresh</button>
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {positions.map((position, index) => (
            <article key={valueOf(position, ["id", "positionId", "symbol"], String(index))} className="zar-glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/35">Holding</div>
                  <h3 className="mt-1 text-xl font-semibold">{valueOf(position, ["symbol", "ticker"])}</h3>
                </div>
                <TrendingUp className="text-emerald-300" size={20} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-white/35">Quantity</div><div>{valueOf(position, ["quantity", "qty", "position"])}</div></div>
                <div><div className="text-white/35">Market value</div><div>{valueOf(position, ["marketValue", "value", "currentValue"])}</div></div>
                <div><div className="text-white/35">Average cost</div><div>{valueOf(position, ["averageCost", "avgCost", "costBasis"])}</div></div>
                <div><div className="text-white/35">Gain / loss</div><div>{valueOf(position, ["unrealizedPnl", "pnl", "profitLoss"])}</div></div>
              </div>
            </article>
          ))}
        </div>
      )}
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
          {destination ? (kind === "chat" ? "Opening ZAR" : "Opening ZCOS Upload") : "ZCOS connection needed"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {kind === "chat"
            ? "ZAR remains the same operator, with ZILLION and CAPITAL supplied as active context."
            : "Files continue through the canonical ZCOS intake; ZILLION does not create a second upload pipeline."}
        </p>
        {destination ? (
          <a className="btn-touch mt-5 inline-flex items-center rounded-full border border-emerald-300/25 px-4 text-sm text-emerald-100" href={destination}>Continue</a>
        ) : (
          <p className="mt-4 text-sm text-amber-200">ZAR needs the ZCOS application URL configured before this action can continue.</p>
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

  useEffect(() => {
    if (domain && external) window.location.assign(external);
  }, [domain?.id, external]);

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
        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: domain.color }}>{domain.authority} authority</div>
        <h2 className="mt-2 text-3xl font-semibold">{domain.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">{external ? "Opening the shared ZCOS authority in ZILLION context…" : domain.summary}</p>
        {!external && <p className="mt-5 text-sm text-amber-200">ZAR needs the ZCOS portal URL configured before this domain can open.</p>}
      </section>
    </CapitalWorkspaceShell>
  );
}
