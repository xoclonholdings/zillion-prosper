import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runWithOwnerContext } from "./OwnerExecutionContext";
import { invokeZcosCapability, signZcosCapability } from "./ZcosCapabilityClient";

const secret = "test-capability-secret-with-at-least-32-characters";

describe("ZCOS capability client", () => {
  beforeEach(() => {
    process.env.ZILLION_CAPABILITY_SECRET = secret;
    process.env.ZCOS_CAPABILITY_BASE_URL = "https://zcos.example";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ZILLION_CAPABILITY_SECRET;
    delete process.env.ZCOS_CAPABILITY_BASE_URL;
  });

  it("creates a deterministic owner-bound signature", () => {
    const signature = signZcosCapability({
      timestamp: "1000",
      messageId: "message-1",
      ownerUserId: "owner-123",
      method: "POST",
      path: "/api/capabilities/model/chat",
      body: "{}",
      secret,
    });
    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(signature).not.toBe(
      signZcosCapability({
        timestamp: "1000",
        messageId: "message-1",
        ownerUserId: "owner-456",
        method: "POST",
        path: "/api/capabilities/model/chat",
        body: "{}",
        secret,
      }),
    );
  });

  it("sends the active authenticated owner and signature", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-ZCOS-Owner")).toBe("owner-123");
      expect(headers.get("X-ZCOS-Signature")).toMatch(/^sha256=/);
      expect(headers.get("X-ZCOS-Message-Id")).toBeTruthy();
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await runWithOwnerContext("owner-123", () =>
      invokeZcosCapability("/api/capabilities/model/chat", { body: { prompt: "test" } }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed without an authenticated owner context", async () => {
    await expect(invokeZcosCapability("/api/capabilities/model/chat")).rejects.toThrow(/owner/i);
  });
});
