import { describe, expect, it } from "vitest";
import { isLiveTradingCertified, LIVE_TRADING_CERTIFICATION } from "./LiveCertification";

describe("live trading certification", () => {
  it("fails closed", () => {
    expect(isLiveTradingCertified()).toBe(false);
  });

  it("cannot be enabled by environment configuration", () => {
    process.env.CAPITAL_LIVE_TRADING_CERTIFIED = "true";
    expect(isLiveTradingCertified()).toBe(false);
    expect(LIVE_TRADING_CERTIFICATION.code).toBe("separate_certification_required");
    delete process.env.CAPITAL_LIVE_TRADING_CERTIFIED;
  });
});
