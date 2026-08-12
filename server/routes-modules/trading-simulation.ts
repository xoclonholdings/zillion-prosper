import type { Express } from "express";

import { isAuthenticated } from "../localAuth";
import {
  getSimulationSnapshot,
  resetSimulationAccount,
} from "../zcos/trading/SimulationAccountStore";
import { userIdFrom, toNumber } from "./trading-route-helpers";

export function registerTradingSimulationRoutes(app: Express): void {
  app.get("/api/trading/simulation", isAuthenticated, async (req: any, res) => {
    res.json({ simulation: await getSimulationSnapshot(userIdFrom(req)) });
  });

  app.post("/api/trading/simulation/reset", isAuthenticated, async (req: any, res) => {
    try {
      const startingBalance = toNumber(req.body?.startingBalance, Number.NaN);
      const simulation = await resetSimulationAccount(userIdFrom(req), startingBalance);
      res.json({ simulation });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Could not reset Simulation.",
      });
    }
  });
}
