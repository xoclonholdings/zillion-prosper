import { describe, expect, it } from "vitest";

import type { SimulationAccountConfig } from "../../../shared/simulation-types";
import type { PaperTrade } from "../../../shared/trading-types";
import { buildSimulationSnapshot } from "./SimulationAccountStore";

const account: SimulationAccountConfig = {
  ownerUserId: "owner-1",
  startingBalance: 10_000,
  initializedAt: "2026-08-12T00:00:00.000Z",
  resetAt: "2026-08-12T01:00:00.000Z",
};

function trade(overrides: Partial<PaperTrade>): PaperTrade {
  return {
    id: "trade-1",
    userId: "owner-1",
    createdAt: "2026-08-12T02:00:00.000Z",
    updatedAt: "2026-08-12T02:00:00.000Z",
    market: "US",
    assetClass: "stock",
    symbol: "TEST",
    direction: "long",
    status: "open",
    entry: 100,
    stop: 90,
    target: 120,
    size: 2,
    riskAmount: 20,
    entryReason: "fixture",
    screenshots: [],
    lessonsLearned: [],
    ruleViolations: [],
    executionMode: "internal",
    executionEnvironment: "simulation",
    ...overrides,
  };
}

describe("Simulation account isolation", () => {
  it("does not invent a balance before the owner initializes Simulation", () => {
    expect(buildSimulationSnapshot(null, [trade({})])).toMatchObject({
      account: null,
      balance: null,
      orders: [],
    });
  });

  it("includes only post-reset Simulation orders", () => {
    const snapshot = buildSimulationSnapshot(account, [
      trade({ id: "before", createdAt: "2026-08-12T00:30:00.000Z" }),
      trade({ id: "live", executionMode: "live", executionEnvironment: "live" }),
      trade({ id: "paper-provider", executionMode: "external_paper", executionEnvironment: "external_paper" }),
      trade({ id: "simulation" }),
    ]);
    expect(snapshot.orders.map((item) => item.id)).toEqual(["simulation"]);
    expect(snapshot.positions.map((item) => item.id)).toEqual(["simulation"]);
    expect(snapshot.balance).toBe(9_800);
  });

  it("keeps realized performance separate from open-position reserves", () => {
    const snapshot = buildSimulationSnapshot(account, [
      trade({ id: "open" }),
      trade({
        id: "closed",
        status: "closed",
        entry: 50,
        size: 1,
        realizedPnl: 125,
        outcome: "win",
      }),
    ]);
    expect(snapshot.performance.realizedPnl).toBe(125);
    expect(snapshot.performance.winRate).toBe(1);
    expect(snapshot.balance).toBe(9_925);
  });
});
