import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, RefreshCw, Sparkles, WalletCards, X } from "lucide-react";
import { useLocation } from "wouter";

import { CapitalWorkspaceShell } from "./CapitalWorkspaceShell";

type JsonRecord = Record<string, any>;

type BrokerStatus = {
  connected?: boolean;
};

type AgentResponse = {
  message?: string;
  requiresApproval?: boolean;
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

export function InvestWorkspace() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<BrokerStatus | null>(null);
  const [positions, setPositions] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
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

  function compactHoldings() {
    return positions.slice(0, 25).map((p) => ({
      symbol: valueOf(p, ["symbol", "ticker"]),
      quantity: valueOf(p, ["quantity", "qty", "position"]),
      marketValue: valueOf(p, ["marketValue", "value", "currentValue"]),
      averageCost: valueOf(p, ["averageCost", "avgCost", "costBasis"]),
      pnl: valueOf(p, ["unrealizedPnl", "pnl", "profitLoss"]),
    }));
  }

  async function reviewPortfolio() {
    setBusy(true);
    setError(null);
    setFollowUp(null);
    try {
      const payload: AgentResponse = await requestJson("/api/capital/agent", {
        method: "POST",
        body: JSON.stringify({
          task: `Review these verified current holdings and give me ONE clear long-term investing action. Keep it simple. If a fact needed to make a sound recommendation is missing, ask only for that missing information instead of guessing. Do not claim any order was placed or money moved. Holdings: ${JSON.stringify(compactHoldings())}`,
        }),
      });
      setRecommendation(payload.message || "ZAR did not return a recommendation.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not review the portfolio.");
    } finally {
      setBusy(false);
    }
  }

  async function approvePlan() {
    if (!recommendation) return;
    setBusy(true);
    setError(null);
    try {
      const payload: AgentResponse = await requestJson("/api/capital/agent", {
        method: "POST",
        body: JSON.stringify({
          task: `The user approved this investing recommendation: ${recommendation}\n\nContinue the investing task now. Ask only for the single next piece of information or authorization you need from the user to implement the plan safely. If no user input is needed yet, state the exact next action ZAR can take. Do not claim an order was placed or funds moved unless a connected execution provider actually confirms it.`
        }),
      });
      setFollowUp(payload.message || "ZAR needs more information before continuing.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not continue the investing plan.");
    } finally {
      setBusy(false);
    }
  }

  async function answerZar(event: FormEvent) {
    event.preventDefault();
    if (!answer.trim() || !recommendation || !followUp) return;
    setBusy(true);
    setError(null);
    try {
      const payload: AgentResponse = await requestJson("/api/capital/agent", {
        method: "POST",
        body: JSON.stringify({
          task: `We are implementing this approved investing recommendation: ${recommendation}\n\nZAR's last question/instruction was: ${followUp}\n\nThe user answered: ${answer.trim()}\n\nContinue from here. Ask only for the next missing information or authorization if needed. Keep the user-facing response concise. Never claim an investment executed unless the connected provider actually confirms execution.`
        }),
      });
      setFollowUp(payload.message || "ZAR could not determine the next step.");
      setAnswer("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not continue from that answer.");
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
            <p className="mt-2 text-sm leading-6 text-white/50">ZAR handles the portfolio work and asks only for what it still needs.</p>
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
            <p className="mt-2 text-sm leading-6 text-white/50">Connect the brokerage account or upload a current statement. ZAR will not guess your portfolio.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate("/capital/trade/live")} className="btn-touch rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950">Connect account</button>
              <button type="button" onClick={() => navigate("/capital/upload")} className="btn-touch rounded-xl border border-white/15 py-3 text-sm font-semibold">Upload statement</button>
            </div>
          </section>
        ) : positions.length === 0 ? (
          <section className="zar-glass rounded-3xl p-6">
            <h3 className="text-2xl font-semibold">I’m connected, but I don’t see holdings yet.</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">Refresh after the provider updates, or upload a current statement if the investments live somewhere else.</p>
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

            {!followUp ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" disabled={busy} onClick={() => void approvePlan()} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-bold text-slate-950 disabled:opacity-50"><Check size={18} /> Use this plan</button>
                <button type="button" disabled={busy} onClick={() => setRecommendation(null)} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold text-white/75"><X size={18} /> Pass</button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/65">ZAR needs next</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{followUp}</p>
                <form onSubmit={answerZar} className="mt-4 flex gap-2">
                  <input value={answer} onChange={(event) => setAnswer(event.target.value)} className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 text-sm" placeholder="Answer ZAR" />
                  <button disabled={busy || !answer.trim()} className="btn-touch rounded-xl bg-emerald-300 px-4 text-sm font-bold text-slate-950 disabled:opacity-50">Continue</button>
                </form>
              </div>
            )}
          </section>
        )}

        {positions.length > 0 && (
          <>
            <button type="button" onClick={() => setShowDetails((value) => !value)} className="btn-touch mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">
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
