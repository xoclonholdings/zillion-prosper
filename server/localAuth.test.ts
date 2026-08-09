import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  exchangeLaunchGrantForSession,
  issueOwnerGrant,
  resetConsumedLaunchGrantsForTests,
  verifyOwnerGrant,
} from "./localAuth";

const secret = "test-capability-secret-with-at-least-32-characters";

describe("ZCOS owner grants", () => {
  beforeEach(() => {
    process.env.ZILLION_CAPABILITY_SECRET = secret;
    resetConsumedLaunchGrantsForTests();
  });

  afterEach(() => {
    delete process.env.ZILLION_CAPABILITY_SECRET;
  });

  it("exchanges a short launch grant for a longer Zillion session", () => {
    const launch = issueOwnerGrant("owner-123", "launch", 90);
    const exchange = exchangeLaunchGrantForSession(launch);
    const session = verifyOwnerGrant(exchange.sessionToken, "session");

    expect(exchange.ownerUserId).toBe("owner-123");
    expect(session.sub).toBe("owner-123");
    expect(session.exp - session.iat).toBe(8 * 60 * 60);
  });

  it("rejects replay of a consumed launch grant", () => {
    const launch = issueOwnerGrant("owner-123", "launch");
    exchangeLaunchGrantForSession(launch);
    expect(() => exchangeLaunchGrantForSession(launch)).toThrow(/already used/i);
  });

  it("rejects forged grants and prohibited owners", () => {
    const launch = issueOwnerGrant("owner-123", "launch");
    expect(() => verifyOwnerGrant(`${launch.slice(0, -1)}x`)).toThrow(/signature/i);
    expect(() => issueOwnerGrant("user_001", "launch")).toThrow(/owner/i);
  });

  it("does not accept a session token as a launch grant", () => {
    const session = issueOwnerGrant("owner-123", "session");
    expect(() => exchangeLaunchGrantForSession(session)).toThrow(/invalid/i);
  });
});
