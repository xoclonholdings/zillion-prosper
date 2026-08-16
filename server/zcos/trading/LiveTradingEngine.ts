import type {
  LiveTradingConfig,
  LiveTradingState,
} from "../../../shared/trading-training-types";

import { readTradingObject, writeTradingObject } from "./tradingPersistence";
import { getQualificationReport } from "./QualificationEngine";
import { tradovateConfigured } from "./TradovateBridge";
import { getWebullStatus } from "./WebullAuth";
import { loadProgression } from "../../services/TradingProgressionStore";
import { isLiveTradingCertified, LIVE_TRADING_CERTIFICATION } from "./LiveCertification";

/**
 * Stage 7 — Live trading (governed).
 *
 * The engine owns the technical gates, but the user should only be asked
 * for the next thing they can actually do. Internal certification remains
 * fail-closed and is deliberately ordered after user-actionable requirements.
 */

const CONFIG_SCOPE = "live-config";

export const DEFAULT_LIVE_CONFIG: LiveTradingConfig = {
  maxRiskPerTrade: 100,
  maxDailyLoss: 1000,
  maxTotalDrawdown: 2000,
  killSwitchArmed: false,
};

async function loadConfig(userId: string): Promise<LiveTradingConfig> {
  const stored = await readTradingObject<LiveTradingConfig>(CONFIG_SCOPE, userId);
  return { ...DEFAULT_LIVE_CONFIG, ...(stored || {}) };
}

export async function saveLiveConfig(
  userId: string,
  patch: Partial<LiveTradingConfig>,
): Promise<LiveTradingConfig> {
  const next = { ...(await loadConfig(userId)), ...patch };
  await writeTradingObject(CONFIG_SCOPE, userId, next);
  return next;
}

export async function setKillSwitch(userId: string, armed: boolean): Promise<LiveTradingState> {
  await saveLiveConfig(userId, { killSwitchArmed: armed });
  return getLiveState(userId);
}

async function broker(userId: string): Promise<{ connected: boolean; label: string }> {
  const tv = await tradovateConfigured(userId).catch(() => ({ configured: false, environment: "demo" as const }));
  if (tv.configured && tv.environment === "live") {
    return { connected: true, label: "Tradovate (live)" };
  }
  const webull = await getWebullStatus(userId).catch(() => null);
  if (webull?.connected && webull.mode === "production") {
    return { connected: true, label: "Webull (production)" };
  }
  return { connected: false, label: "No broker connected" };
}

export async function getLiveState(userId: string): Promise<LiveTradingState> {
  const config = await loadConfig(userId);
  const brokerInfo = await broker(userId);
  const progression = await loadProgression(userId).catch(() => null);
  const qualPassed =
    progression?.assessments?.qualification?.passed ??
    (await getQualificationReport(userId).then((r) => r.ready).catch(() => false));

  const blockers: string[] = [];

  // User-actionable requirements come first because the Capital UI surfaces
  // only the next blocker. ZAR should ask for something the user can resolve,
  // not expose an internal engineering checklist.
  if (!qualPassed) {
    blockers.push("I need more Simulation evidence before I can responsibly use real money. Keep testing with me in Simulation and I’ll track when we’re ready.");
  }
  if (!brokerInfo.connected) {
    blockers.push("I need a real brokerage account connected before I can place a Live order.");
  }
  if (!config.killSwitchArmed) {
    blockers.push("I need your risk controls turned on before I can place a Live order.");
  }
  if (!isLiveTradingCertified()) {
    blockers.push("Live execution still needs the ZILLION production safety gate enabled. I can keep researching and testing setups without risking real money until that system gate is ready.");
  }

  const canExecute =
    isLiveTradingCertified() &&
    qualPassed &&
    brokerInfo.connected &&
    config.killSwitchArmed;
  const status: LiveTradingState["status"] = canExecute
    ? "armed"
    : qualPassed && !brokerInfo.connected
      ? "ready_pending_broker"
      : "blocked";

  const summary = canExecute
    ? "Everything I need is ready. I can research a setup and bring you the decision before any real order is sent."
    : status === "ready_pending_broker"
      ? "I’m ready to operate Live once you connect the brokerage account you want me to use."
      : blockers[0] || LIVE_TRADING_CERTIFICATION.message;

  return {
    config,
    brokerConnected: brokerInfo.connected,
    brokerLabel: brokerInfo.label,
    qualificationPassed: qualPassed,
    canExecute,
    status,
    blockers,
    summary,
  };
}
