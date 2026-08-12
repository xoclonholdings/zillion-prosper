import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldCheck } from "lucide-react";

import type { SimulationSnapshot } from "@shared/simulation-types";
import type { PaperTrade } from "@shared/trading-types";
import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";

const TABS = ["Balance", "Markets", "Trade", "Positions", "Performance"] as const;
type SimulationTab = (typeof TABS)[number];

const EMPTY_TRADE = {
  symbol: "",
  direction: "long" as "long" | "short",
  entry: "",
  stop: "",
  target: "",
  size: "1",
  riskAmount: "",
  entryReason: "",
};

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not initialized";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

async function jsonRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "The request could not be completed.");
  return body as T;
}

export function SimulationWorkspace() {
  const [active, setActive] = useState<SimulationTab>("Balance");
  const [simulation, setSimulation] = useState<SimulationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState("");
  const [marketSymbol, setMarketSymbol] = useState("");
  const [marketResult, setMarketResult] = useState<any>(null);
  const [trade, setTrade] = useState(EMPTY_TRADE);
  const [closeValues, setCloseValues] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await jsonRequest<{ simulation: SimulationSnapshot }>("/api/trading/simulation");
      setSimulation(body.simulation);
      if (body.simulation.account) {
        setStartingBalance(String(body.simulation.account.startingBalance));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Simulation is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function resetAccount() {
    const amount = Number(startingBalance);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid simulated starting balance.");
      return;
    }
    if (simulation?.account && !window.confirm("Reset the visible Simulation account? Historical testing evidence will be preserved.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = await jsonRequest<{ simulation: SimulationSnapshot }>("/api/trading/simulation/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingBalance: amount }),
      });
      setSimulation(body.simulation);
      setNotice(simulation?.account ? "Visible Simulation account reset. Historical evidence was preserved." : "Simulation account initialized.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Simulation could not be initialized.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupMarket() {
    const symbol = marketSymbol.trim().toUpperCase();
    if (!symbol) return;
    setBusy(true);
    setError(null);
    try {
      const body = await jsonRequest<any>("/api/trading/market-data/signal?symbol=" + encodeURIComponent(symbol));
      setMarketResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Market data is unavailable.");
      setMarketResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function placeSimulationOrder() {
    if (!simulation?.account) {
      setError("Initialize Simulation before placing an order.");
      setActive("Balance");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = {
        market: "US",
        assetClass: "stock",
        symbol: trade.symbol.trim().toUpperCase(),
        direction: trade.direction,
        entry: Number(trade.entry),
        stop: Number(trade.stop),
        target: Number(trade.target),
        size: Number(trade.size),
        riskAmount: Number(trade.riskAmount) || Math.abs(Number(trade.entry) - Number(trade.stop)) * Number(trade.size),
        entryReason: trade.entryReason.trim(),
        managementStyle: "bracket",
      };
      await jsonRequest("/api/trading/paper-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setTrade(EMPTY_TRADE);
      setNotice("Simulation order recorded with governance and execution provenance.");
      await refresh();
      setActive("Positions");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The Simulation order was not accepted.");
    } finally {
      setBusy(false);
    }
  }

  async function closePosition(position: PaperTrade) {
    const exitPrice = Number(closeValues[position.id]);
    if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
      setError("Enter a valid exit price.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await jsonRequest("/api/trading/paper-trades/" + position.id + "/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitPrice, exitReason: "Closed from ZILLION Simulation." }),
      });
      setCloseValues((current) => ({ ...current, [position.id]: "" }));
      await refresh();
      setNotice(position.symbol + " closed in Simulation.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The position could not be closed.");
    } finally {
      setBusy(false);
    }
  }

  const performance = simulation?.performance;
  const initialized = Boolean(simulation?.account);

  return (
    <CapitalWorkspaceShell title="Simulation">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/75">Simulated capital</p>
          <h2 className="mt-1 text-2xl font-semibold">Trading Simulation</h2>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="btn-touch inline-flex items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/60"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Simulation workspace">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={"btn-touch whitespace-nowrap rounded-full border px-4 text-xs " + (
              active === tab
                ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 text-white/55"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-400/25 bg-red-400/[0.06] p-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3 text-sm text-emerald-100">{notice}</div>}

      <section className="zar-glass mt-3 rounded-2xl p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-white/50">Loading Simulation…</p>
        ) : active === "Balance" ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Available balance" value={money(simulation?.balance)} />
              <Metric label="Starting capital" value={money(simulation?.account?.startingBalance)} />
              <Metric label="Reserved in positions" value={money(simulation?.reservedCapital)} />
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
              <label className="text-xs font-medium text-white/60" htmlFor="simulation-balance">
                Simulated starting balance
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="simulation-balance"
                  inputMode="decimal"
                  value={startingBalance}
                  onChange={(event) => setStartingBalance(event.target.value)}
                  placeholder="Enter amount"
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 text-base outline-none focus:border-cyan-300/40"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resetAccount()}
                  className="btn-touch rounded-xl bg-cyan-300/15 px-4 text-sm text-cyan-100 disabled:opacity-50"
                >
                  {initialized ? "Reset" : "Start"}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/40">
                Reset starts a new visible account while retaining prior outcomes as evaluation evidence.
              </p>
            </div>
          </div>
        ) : active === "Markets" ? (
          <div>
            <div className="flex gap-2">
              <input
                value={marketSymbol}
                onChange={(event) => setMarketSymbol(event.target.value)}
                placeholder="Symbol"
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 text-base uppercase outline-none focus:border-cyan-300/40"
              />
              <button type="button" disabled={busy} onClick={() => void lookupMarket()} className="btn-touch rounded-xl border border-cyan-300/25 px-4 text-cyan-100">
                <Search size={17} />
              </button>
            </div>
            {marketResult && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                {marketResult.live ? (
                  <>
                    <div className="text-sm font-semibold">{marketSymbol.trim().toUpperCase()} · {money(marketResult.price)}</div>
                    <p className="mt-1 text-xs text-white/45">Source: {marketResult.source || "authorized market data"}</p>
                    {marketResult.signal && <p className="mt-3 text-sm text-white/65">Signal: {marketResult.signal.action || marketResult.signal.direction || "Observed"}</p>}
                  </>
                ) : (
                  <p className="text-sm text-amber-200">A verified market quote is not available. No price was fabricated.</p>
                )}
              </div>
            )}
          </div>
        ) : active === "Trade" ? (
          <div>
            {!initialized && <p className="mb-4 text-sm text-amber-200">Initialize a simulated balance first.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Symbol" value={trade.symbol} onChange={(value) => setTrade((item) => ({ ...item, symbol: value }))} />
              <label className="text-xs text-white/55">Direction
                <select
                  value={trade.direction}
                  onChange={(event) => setTrade((item) => ({ ...item, direction: event.target.value as "long" | "short" }))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#07100f] px-3 text-base text-white"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </label>
              <Field label="Entry" value={trade.entry} numeric onChange={(value) => setTrade((item) => ({ ...item, entry: value }))} />
              <Field label="Stop" value={trade.stop} numeric onChange={(value) => setTrade((item) => ({ ...item, stop: value }))} />
              <Field label="Target" value={trade.target} numeric onChange={(value) => setTrade((item) => ({ ...item, target: value }))} />
              <Field label="Size" value={trade.size} numeric onChange={(value) => setTrade((item) => ({ ...item, size: value }))} />
              <Field label="Risk amount" value={trade.riskAmount} numeric onChange={(value) => setTrade((item) => ({ ...item, riskAmount: value }))} />
              <Field label="Reason / thesis" value={trade.entryReason} onChange={(value) => setTrade((item) => ({ ...item, entryReason: value }))} />
            </div>
            <button
              type="button"
              disabled={busy || !initialized}
              onClick={() => void placeSimulationOrder()}
              className="btn-touch mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300/15 px-4 text-sm text-cyan-100 disabled:opacity-40"
            >
              <ShieldCheck size={16} /> Review and place in Simulation
            </button>
          </div>
        ) : active === "Positions" ? (
          <div className="space-y-3">
            {simulation?.positions.map((position) => (
              <div key={position.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{position.symbol} · {position.direction}</div>
                  <div className="text-xs text-cyan-200">Simulation</div>
                </div>
                <div className="mt-2 text-xs text-white/45">Entry {money(position.entry)} · Size {position.size}</div>
                <div className="mt-3 flex gap-2">
                  <input
                    inputMode="decimal"
                    value={closeValues[position.id] || ""}
                    onChange={(event) => setCloseValues((current) => ({ ...current, [position.id]: event.target.value }))}
                    placeholder="Exit price"
                    className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 text-base"
                  />
                  <button type="button" disabled={busy} onClick={() => void closePosition(position)} className="btn-touch rounded-xl border border-white/15 px-3 text-sm">
                    Close
                  </button>
                </div>
              </div>
            ))}
            {simulation?.positions.length === 0 && <Empty text="No open Simulation positions." />}
          </div>
        ) : (
          <div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Orders" value={String(performance?.totalOrders ?? 0)} />
              <Metric label="Closed" value={String(performance?.closedOrders ?? 0)} />
              <Metric label="Win rate" value={performance?.winRate === null || performance?.winRate === undefined ? "No sample" : Math.round(performance.winRate * 100) + "%"} />
              <Metric label="Realized P/L" value={money(performance?.realizedPnl ?? 0)} />
            </div>
            <div className="mt-4 space-y-2">
              {simulation?.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm">
                  <span>{transaction.symbol} · {transaction.outcome || "closed"}</span>
                  <span className={(transaction.realizedPnl || 0) >= 0 ? "text-emerald-300" : "text-red-300"}>{money(transaction.realizedPnl)}</span>
                </div>
              ))}
              {simulation?.transactions.length === 0 && <Empty text="No completed Simulation transactions." />}
            </div>
          </div>
        )}
      </section>
    </CapitalWorkspaceShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  numeric,
  onChange,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-white/55">
      {label}
      <input
        inputMode={numeric ? "decimal" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-black/35 px-3 text-base text-white outline-none focus:border-cyan-300/40"
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-white/8 bg-black/20 p-4 text-center text-sm text-white/45">{text}</p>;
}
