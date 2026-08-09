import path from "path";
import express from "express";

import { checkDatabaseConnection, gracefulShutdown, isDatabaseRequired } from "./db";
import { setupLocalAuth } from "./localAuth";
import { runMigrations } from "./migrations";
import { registerBudgetRoutes } from "./routes-modules/budget";
import { registerCapitalAgentRoutes } from "./routes-modules/capital-agent";
import { registerTradingRoutes } from "./routes-modules/trading";
import { registerTradingProgressionRoutes } from "./routes-modules/trading-progression";
import { registerTradingTrainingRoutes } from "./routes-modules/trading-training";
import { LIVE_TRADING_CERTIFICATION } from "./zcos/trading/LiveCertification";

const app = express();
app.set("trust proxy", 1);
const frontendOrigin = process.env.FRONTEND_URL?.trim().replace(/\/$/, "") || "";

app.use((req, res, next) => {
  if (frontendOrigin && req.headers.origin === frontendOrigin) {
    res.setHeader("Access-Control-Allow-Origin", frontendOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "zillion-prosper-capital",
    liveTradingCertified: LIVE_TRADING_CERTIFICATION.certified,
    liveTradingStatus: "blocked_pending_separate_certification",
  });
});

setupLocalAuth(app);
registerBudgetRoutes(app);
registerTradingRoutes(app);
registerTradingProgressionRoutes(app);
registerTradingTrainingRoutes(app);
registerCapitalAgentRoutes(app);

const dist = path.resolve(import.meta.dirname, "../dist/client");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.resolve(dist, "index.html")));
}

const port = Number(process.env.PORT || 5001);

async function start(): Promise<void> {
  const databaseHealthy = await checkDatabaseConnection().catch(() => false);
  if (databaseHealthy) {
    await runMigrations();
  } else if (isDatabaseRequired()) {
    throw new Error("PostgreSQL is required for ZILLION Prosper.");
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`ZILLION Prosper Capital listening on ${port}`);
  });
}

void start().catch((error) => {
  console.error(error);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void gracefulShutdown().finally(() => process.exit(0));
  });
}
