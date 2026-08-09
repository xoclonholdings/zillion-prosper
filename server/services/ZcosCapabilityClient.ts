import { createHmac, randomUUID } from "crypto";

import { currentOwnerUserId } from "./OwnerExecutionContext";

interface CapabilityOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

interface CapabilitySignatureInput {
  timestamp: string;
  messageId: string;
  ownerUserId: string;
  method: string;
  path: string;
  body: string;
  secret: string;
}

function capabilitySecret(): string {
  const value = process.env.ZILLION_CAPABILITY_SECRET?.trim() || "";
  if (value.length < 32) {
    throw new Error("ZILLION_CAPABILITY_SECRET must contain at least 32 characters.");
  }
  return value;
}

export function signZcosCapability(input: CapabilitySignatureInput): string {
  const canonical = [
    input.timestamp,
    input.messageId,
    input.ownerUserId,
    input.method.toUpperCase(),
    input.path,
    input.body,
  ].join("\n");
  return `sha256=${createHmac("sha256", input.secret).update(canonical).digest("hex")}`;
}

export async function invokeZcosCapability<T>(path: string, options: CapabilityOptions = {}): Promise<T> {
  const base = process.env.ZCOS_CAPABILITY_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("ZCOS capability gateway is not configured.");

  const ownerUserId = currentOwnerUserId();
  const method = options.method || "POST";
  const body = options.body === undefined ? "" : JSON.stringify(options.body);
  const timestamp = String(Date.now());
  const messageId = randomUUID();
  const signature = signZcosCapability({
    timestamp,
    messageId,
    ownerUserId,
    method,
    path,
    body,
    secret: capabilitySecret(),
  });

  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-ZCOS-Timestamp": timestamp,
      "X-ZCOS-Message-Id": messageId,
      "X-ZCOS-Owner": ownerUserId,
      "X-ZCOS-Signature": signature,
    },
    body: body || undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(payload?.error || `ZCOS capability failed with HTTP ${response.status}`));
  }
  return payload as T;
}
