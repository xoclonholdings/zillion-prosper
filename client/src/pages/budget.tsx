import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, RefreshCw, Sparkles, X } from "lucide-react";

import {
  INCOME_SOURCE_LABELS,
  allocateDeposit,
  formatCurrency,
  type BudgetState,
  type DepositEntry,
  type IncomeSource,
  type TreasuryReadiness,
} from "@shared/budget-types";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status}).`);
  return body as T;
}

async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data as T;
}

export default function BudgetPage() {
  const [state, setState] = useState<BudgetState | null>(null);
  const [readiness, setReadiness] = useState<TreasuryReadiness | null>(null);
  const [deposits, setDeposits] = useState<DepositEntry[]>([]);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<IncomeSource>("employer");
  const [proposalReady, setProposalReady] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [statePayload, depositPayload] = await Promise.all([
        apiGet<{ state: BudgetState; readiness: TreasuryReadiness }>("/api/budget/state"),
        apiGet<{ deposits: DepositEntry[] }>("/api/budget/deposits"),
      ]);
      setState(statePayload.state);
      setReadiness(statePayload.readiness);
      setDeposits(depositPayload.deposits || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not load the budget.");
    }
  }

  useEffect(() => { void refresh(); }, []);

  const numericAmount = Number(amount);
  const proposal = useMemo(() => {
    if (!state || !Number.isFinite(numericAmount) || numericAmount <= 0) return null;
    return allocateDeposit(numericAmount, state.rule);
  }, [numericAmount, state]);

  function askZar() {
    if (!proposal) {
      setError("Tell ZAR how much money came in.");
      return;
    }
    setError(null);
    setNotice(null);
    setProposalReady(true);
  }

  async function approve() {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost("/api/budget/deposits", { amount: numericAmount, source });
      setNotice("Done. ZAR recorded the allocation and updated your reserves.");
      setAmount("");
      setProposalReady(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ZAR could not record that allocation.");
    } finally {
      setBusy(false);
    }
  }

  const currency = state?.settings.currency || "USD";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/75">Budget</p>
          <h2 className="mt-1 text-3xl font-semibold">Tell ZAR what came in.</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">ZAR works out the split. You approve it.</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="btn-touch rounded-full border border-white/10 p-3 text-white/60" aria-label="Refresh budget">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="mb-3 rounded-xl border border-red-400/25 bg-red-400/[0.06] p-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3 text-sm text-emerald-100">{notice}</div>}

      {!proposalReady ? (
        <section className="zar-glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Sparkles size={17} /> I just need the amount and where it came from.</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              className="min-h-[50px] rounded-xl border border-white/10 bg-black/30 px-4 text-lg outline-none focus:border-emerald-300/40"
            />
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as IncomeSource)}
              className="min-h-[50px] rounded-xl border border-white/10 bg-[#07100f] px-3 text-base text-white"
            >
              {(["employer", "doordash", "instacart", "manual", "other"] as IncomeSource[]).map((item) => (
                <option key={item} value={item}>{INCOME_SOURCE_LABELS[item]}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={askZar} className="btn-touch mt-4 w-full rounded-xl bg-emerald-300 py-3 text-sm font-bold text-slate-950">What should I do?</button>
        </section>
      ) : proposal ? (
        <section className="zar-glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">ZAR recommends</p>
          <h3 className="mt-2 text-2xl font-semibold">Here’s how I’d split {formatCurrency(proposal.total, currency)}.</h3>
          <p className="mt-2 text-sm leading-6 text-white/50">Based on your current allocation rule and reserve settings.</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Savings" value={formatCurrency(proposal.savings, currency)} />
            <Metric label="Taxes" value={formatCurrency(proposal.taxes, currency)} />
            <Metric label="Payroll" value={formatCurrency(proposal.payroll, currency)} />
            <Metric label="Treasury" value={formatCurrency(proposal.treasury, currency)} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => void approve()} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-bold text-slate-950 disabled:opacity-50">
              <Check size={18} /> Approve
            </button>
            <button type="button" disabled={busy} onClick={() => setProposalReady(false)} className="btn-touch flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold text-white/75">
              <X size={18} /> Change
            </button>
          </div>
        </section>
      ) : null}

      <button type="button" onClick={() => setShowDetails((value) => !value)} className="btn-touch mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">
        <span>Details</span>{showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showDetails && (
        <section className="zar-glass mt-3 rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Savings" value={formatCurrency(state?.balances.savingsBalance || 0, currency)} />
            <Metric label="Emergency" value={formatCurrency(state?.balances.emergencyFundBalance || 0, currency)} />
            <Metric label="Treasury" value={formatCurrency(state?.balances.treasuryBalance || 0, currency)} />
          </div>
          {readiness && <p className="mt-4 text-sm text-white/50">{readiness.currentStageLabel} · {readiness.nextMilestoneLabel}</p>}
          <div className="mt-5 space-y-2">
            {deposits.slice(0, 5).map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <span>{INCOME_SOURCE_LABELS[deposit.source]}</span>
                <span className="font-semibold">{formatCurrency(deposit.amount, currency)}</span>
              </div>
            ))}
            {deposits.length === 0 && <p className="text-sm text-white/40">No budget activity yet.</p>}
          </div>
        </section>
      )}
    </div>
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
