import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, RefreshCw, ShieldCheck, X } from "lucide-react";

import type { SimulationSnapshot } from "@shared/simulation-types";
import type { PaperTrade } from "@shared/trading-types";
import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";

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
  entryPlan?: string;
  stopPlan?: string;
  targetPlan?: string;
  thesisId?: string;
  timeframe?: string;
  setupType?: string;
  marketData?: { live?: boolean; source?: string | null; price?: number | null };
  reason?: string;
};

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

async function jsonRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "The request could not be completed.");
  return body as T;
}

export function SimulationWorkspace() {
  const [simulation, setSimulation] = useState<SimulationSnapshot | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState("10000");
  const [showDetails, setShowDetails] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await jsonRequest<{ simulation: SimulationSnapshot }>("/api/trading/simulation");
      setSimulation(body.simulation);
      if (body.simulation.account) setStartingBalance(String(body.simulation.account.startingBalance));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Simulation is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function startSimulation() {
    const amount = Number(startingBalance);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Tell ZAR how much practice money to use.");
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
      setNotice("Simulation is ready. ZAR can start looking for a setup.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not start Simulation.");
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
      const body = await jsonRequest<Proposal>("/api/trading/strategies/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: "stock", market: "US", directionPreference: "auto" }),
      });
      setProposal(body);
      if (body.action === "no_trade") setNotice(body.reason || "ZAR did not find a setup worth taking right now.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not find a trade right now.");
    } finally {
      setBusy(false);
    }
  }

  async function takeTrade() {
    if (!proposal?.symbol || !proposal.direction || proposal.entry === undefined || proposal.stop === undefined || proposal.target === undefined) {
      setError("ZAR's proposal is missing required trade information.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await jsonRequest("/api/trading/paper-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesisId: proposal.thesisId,
          market: "US",
          assetClass: "stock",
          symbol: proposal.symbol,
          direction: proposal.direction,
          timeframe: proposal.timeframe,
          setupName: proposal.setupType || "ZAR proposal",
          entry: proposal.entry,
          stop: proposal.stop,
          target: proposal.target,
          size: proposal.size || 1,
          riskAmount: proposal.riskAmount || Math.abs(proposal.entry - proposal.stop) * (proposal.size || 1),
          entryReason: proposal.thesis || proposal.basis || "ZAR-generated Simulation proposal.",
          managementStyle: "bracket",
        }),
      });
      setNotice(`${proposal.symbol} is now running in Simulation. ZAR will track the result.`);
      setProposal(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not place that Simulation trade.");
    } finally {
      setBusy(false);
    }
  }

  const initialized = Boolean(simulation?.account);
  const performance = simulation?.performance;

  return (
    <CapitalWorkspaceShell title="Simulation">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/75">Simulation</p>
            <h2 className="mt-1 text-3xl font-semibold">ZAR does the work. You decide.</h2>
          </div>
          <button type="button" onClick={() => void refresh()} className="btn-touch rounded-full border border-white/10 p-3 text-white/60" aria-label="Refresh Simulation">
            <RefreshCw size={16} />
          </button>
        </div>

        {error && <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/[0.06] p-3 text-sm text-red-200">{error}</div>}
        {notice && <div className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3 text-sm text-emerald-100">{notice}</div>}

        {!initialized ? (
          <section className="zar-glass rounded-3xl p-6">
            <div className="text-sm font-semibold text-cyan-100">I need one thing before I start.</div>
            <h3 className="mt-2 text-2xl font-semibold">How much practice money should I use?</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">This is simulated money only. It never touches a real account.</p>
            <div className="mt-5 flex gap-2">
              <input
                inputMode="decimal"
                value={startingBalance}
                onChange={(event) => setStartingBalance(event.target.value)}
                className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none focus:border-cyan-300/40"
                placeholder="10000"
              />
              <button type="button" disabled={busy} onClick={() => void startSimulation()} className="btn-touch rounded-xl bg-cyan-300/15 px-5 text-sm font-semibold text-cyan-100 disabled:opacity-50">Start</button>
            </div>
          </section>
        ) : (
          <>
            <section className="zar-glass rounded-3xl p-6">
              {!proposal || proposal.action === "no_trade" ? (
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                    <ShieldCheck size={22} className="text-cyan-200" />
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold">Want me to find a trade?</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">I’ll scan the market, build the setup, size the risk, and bring you one decision.</p>
                  <button type="button" disabled={busy || loading} onClick={() => void findTrade()} className="btn-touch mt-5 rounded-xl bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
                    {busy ? "Looking…" : "Find one"}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">ZAR found a setup</p>
                      <h3 className="mt-1 text-3xl font-semibold">{proposal.symbol} · {proposal.direction === "short" ? "Sell" : "Buy"}</h3>
                    </div>
                    {proposal.confidence !== undefined && <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{proposal.confidence}% confidence</div>}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/65">{proposal.thesis || proposal.basis || "ZAR found a setup that meets the current Simulation rules."}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="Entry" value={money(proposal.entry)} />
                    <Metric label="Risk" value={money(proposal.riskAmount)} />
                    <Metric label="Target" value={money(proposal.target)} />
                    <Metric label="R / R" value={proposal.riskReward ? `${proposal.riskReward}:1` : "—"} />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button type="button" disabled={busy} onClick={() => void takeTrade()} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-bold text-slate-950 disabled:opacity-50">
                      <Check size={18} /> Take Trade
                    </button>
                    <button type="button" disabled={busy} onClick={() => { setProposal(null); setNotice("Passed. ZAR will keep looking when you ask again."); }} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold text-white/75">
                      <X size={18} /> Pass
                    </button>
                  </div>
                </div>
              )}
            </section>

            <button type="button" onClick={() => setShowDetails((value) => !value)} className="btn-touch mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">
              <span>Details</span>{showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDetails && (
              <section className="zar-glass mt-3 rounded-2xl p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Available" value={money(simulation?.balance)} />
                  <Metric label="Open positions" value={String(simulation?.positions?.length || 0)} />
                  <Metric label="Win rate" value={performance ? `${Math.round((performance.winRate || 0) * 100)}%` : "—"} />
                </div>
                <div className="mt-5 space-y-3">
                  {(simulation?.positions || []).length === 0 ? (
                    <p className="text-sm text-white/45">No open Simulation positions.</p>
                  ) : simulation?.positions.map((position: PaperTrade) => (
                    <div key={position.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{position.symbol}</span>
                        <span className="text-xs text-cyan-200">{position.direction}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/45">Entry {money(position.entry)} · Size {position.size}</div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}
