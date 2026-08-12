import type { PaperTrade } from "./trading-types";

export interface SimulationAccountConfig {
  ownerUserId: string;
  startingBalance: number;
  initializedAt: string;
  resetAt: string;
}

export interface SimulationResetEvidence {
  resetAt: string;
  previousResetAt: string;
  startingBalance: number;
  endingBalance: number;
  realizedPnl: number;
  totalOrders: number;
  closedOrders: number;
}

export interface SimulationPerformance {
  totalOrders: number;
  openPositions: number;
  closedOrders: number;
  wins: number;
  losses: number;
  winRate: number | null;
  realizedPnl: number;
  maximumDrawdown: number;
}

export interface SimulationSnapshot {
  account: SimulationAccountConfig | null;
  balance: number | null;
  reservedCapital: number;
  orders: PaperTrade[];
  positions: PaperTrade[];
  transactions: PaperTrade[];
  performance: SimulationPerformance;
}
