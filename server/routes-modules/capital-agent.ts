import type { Express } from "express";

import { FinanceAgent } from "../agents/finance/FinanceAgent";
import { isAuthenticated } from "../localAuth";
import { ownerUserIdFromAuthenticatedRequest } from "../services/auth/OwnerContext";

export function registerCapitalAgentRoutes(app: Express): void {
  app.post("/api/capital/agent", isAuthenticated, async (req, res) => {
    try {
      const result = await FinanceAgent.process({
        userId: ownerUserIdFromAuthenticatedRequest(req),
        task: String(req.body?.task || req.body?.message || ""),
        conversationId: req.body?.conversationId ? String(req.body.conversationId) : undefined,
        memoryContext: req.body?.memoryContext ? String(req.body.memoryContext) : undefined,
        reasoningEffort: req.body?.reasoningEffort,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Capital agent failed." });
    }
  });
}
