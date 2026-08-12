import type {
  SimulationAccountConfig,
  SimulationResetEvidence,
  SimulationSnapshot,
} from "../../../shared/simulation-types";
import type { PaperTrade } from "../../../shared/trading-types";

import { readTradingObject, writeTradingObject } from "./tradingPersistence";
import { TradingStore } from "./TradingStore";

const ACCOUNT_SCOPE = "simulation-account-v1";
const RESET_EVIDENCE_SCOPE = "simulation-reset-evidence-v1";
const MAX_STARTING_BALANCE = 1_000_000_000_000;

interface StoredSimulationAccount {
  config: SimulationAccountConfig;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(4));
}

function isSimulationOrder(trade: PaperTrade): boolean {
  const environment = trade.executionEnvironment;
  if (environment) return environment === "simulation";
  return !trade.executionMode || trade.executionMode === "internal";
}

function maximumDrawdown(trades: readonly PaperTrade[]): number {
  let equity = 0;
  let peak = 0;
  let drawdown = 0;
  for (const trade of trades
    .filter((item) => item.status === "closed")
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    equity += trade.realizedPnl || 0;
    peak = Math.max(peak, equity);
    drawdown = Math.min(drawdown, equity - peak);
  }
  return roundMoney(drawdown);
}

export function buildSimulationSnapshot(
  account: SimulationAccountConfig | null,
  sourceTrades: readonly PaperTrade[],
): SimulationSnapshot {
  if (!account) {
    return {
      account: null,
      balance: null,
      reservedCapital: 0,
      orders: [],
      positions: [],
      transactions: [],
      performance: {
        totalOrders: 0,
        openPositions: 0,
        closedOrders: 0,
        wins: 0,
        losses: 0,
        winRate: null,
        realizedPnl: 0,
        maximumDrawdown: 0,
      },
    };
  }

  const orders = sourceTrades
    .filter(isSimulationOrder)
    .filter((trade) => trade.createdAt >= account.resetAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const positions = orders.filter((trade) => trade.status === "open");
  const transactions = orders.filter((trade) => trade.status === "closed");
  const realizedPnl = roundMoney(
    transactions.reduce((sum, trade) => sum + (trade.realizedPnl || 0), 0),
  );
  const reservedCapital = roundMoney(
    positions.reduce((sum, trade) => sum + Math.abs(trade.entry * trade.size), 0),
  );
  const wins = transactions.filter((trade) => (trade.realizedPnl || 0) > 0).length;
  const losses = transactions.filter((trade) => (trade.realizedPnl || 0) < 0).length;

  return {
    account,
    balance: roundMoney(account.startingBalance + realizedPnl - reservedCapital),
    reservedCapital,
    orders,
    positions,
    transactions,
    performance: {
      totalOrders: orders.length,
      openPositions: positions.length,
      closedOrders: transactions.length,
      wins,
      losses,
      winRate: transactions.length ? Number((wins / transactions.length).toFixed(4)) : null,
      realizedPnl,
      maximumDrawdown: maximumDrawdown(transactions),
    },
  };
}

async function loadConfig(ownerUserId: string): Promise<SimulationAccountConfig | null> {
  const stored = await readTradingObject<StoredSimulationAccount>(ACCOUNT_SCOPE, ownerUserId);
  return stored?.config || null;
}

export async function getSimulationSnapshot(ownerUserId: string): Promise<SimulationSnapshot> {
  const [account, trades] = await Promise.all([
    loadConfig(ownerUserId),
    TradingStore.listPaperTrades(ownerUserId),
  ]);
  return buildSimulationSnapshot(account, trades);
}

export async function resetSimulationAccount(
  ownerUserId: string,
  startingBalance: number,
): Promise<SimulationSnapshot> {
  if (
    !Number.isFinite(startingBalance) ||
    startingBalance <= 0 ||
    startingBalance > MAX_STARTING_BALANCE
  ) {
    throw new Error("Enter a valid simulated starting balance.");
  }

  const previous = await getSimulationSnapshot(ownerUserId);
  if (previous.account) {
    const evidence =
      (await readTradingObject<SimulationResetEvidence[]>(RESET_EVIDENCE_SCOPE, ownerUserId)) || [];
    evidence.push({
      resetAt: new Date().toISOString(),
      previousResetAt: previous.account.resetAt,
      startingBalance: previous.account.startingBalance,
      endingBalance: previous.balance ?? previous.account.startingBalance,
      realizedPnl: previous.performance.realizedPnl,
      totalOrders: previous.performance.totalOrders,
      closedOrders: previous.performance.closedOrders,
    });
    await writeTradingObject(RESET_EVIDENCE_SCOPE, ownerUserId, evidence);
  }

  const timestamp = new Date().toISOString();
  const config: SimulationAccountConfig = {
    ownerUserId,
    startingBalance: roundMoney(startingBalance),
    initializedAt: previous.account?.initializedAt || timestamp,
    resetAt: timestamp,
  };
  await writeTradingObject(ACCOUNT_SCOPE, ownerUserId, { config });
  return buildSimulationSnapshot(config, []);
}
