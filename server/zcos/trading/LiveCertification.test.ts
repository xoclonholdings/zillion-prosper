import { afterEach, describe, expect, it } from "vitest";
import { isLiveTradingCertified, LIVE_TRADING_CERTIFICATION } from "./LiveCertification";

afterEach(() => {
  delete process.env.ZILLION_LIVE_TRADING_CERTIFIED;
});

describe("live trading certification", () => {
  it("fails closed by default", () => {
    expect(isLiveTradingCertified()).toBe(false);
  });

  it("requires the explicit ZILLION production certification setting", () => {
    process.env.ZILLION_LIVE_TRADING_CERTIFIED = "true";
    expect(isLiveTradingCertified()).toBe(true);
    expect(LIVE_TRADING_CERTIFICATION.code).toBe("production_certification_required");
  });

  it("does not accept other truthy values", () => {
    process.env.ZILLION_LIVE_TRADING_CERTIFIED = "1";
    expect(isLiveTradingCertified()).toBe(false);
  });
});
