import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { Express, NextFunction, Request, Response } from "express";

import { createOwnerContext } from "./services/auth/OwnerContext";
import { runWithOwnerContext } from "./services/OwnerExecutionContext";

const COOKIE_NAME = "zillion_owner";
const AUDIENCE = "zillion-prosper";
const LAUNCH_TTL_SECONDS = 90;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

type GrantKind = "launch" | "session" | "capability";

interface OwnerGrant {
  sub: string;
  iss: "zcos" | "zillion";
  aud: typeof AUDIENCE;
  kind: GrantKind;
  iat: number;
  exp: number;
  nonce: string;
}

const consumedLaunchNonces = new Map<string, number>();
const consumedCapabilityNonces = new Map<string, number>();

function secret(): string {
  const value = process.env.ZILLION_CAPABILITY_SECRET?.trim() || "";
  if (value.length < 32) {
    throw new Error("ZILLION_CAPABILITY_SECRET must contain at least 32 characters.");
  }
  return value;
}

function sign(encoded: string): string {
  return createHmac("sha256", secret()).update(encoded).digest("base64url");
}

export function issueOwnerGrant(
  ownerUserId: string,
  kind: GrantKind,
  ttlSeconds = kind === "session" ? SESSION_TTL_SECONDS : LAUNCH_TTL_SECONDS,
): string {
  const owner = createOwnerContext(ownerUserId).ownerUserId;
  const now = Math.floor(Date.now() / 1000);
  const payload: OwnerGrant = {
    sub: owner,
    iss: kind === "session" ? "zillion" : "zcos",
    aud: AUDIENCE,
    kind,
    iat: now,
    exp: now + ttlSeconds,
    nonce: randomUUID(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyOwnerGrant(token: string, expectedKind?: GrantKind): OwnerGrant {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("Malformed Capital grant.");

  const expected = sign(encoded);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid Capital grant signature.");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OwnerGrant;
  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer = payload.kind === "session" ? "zillion" : "zcos";
  if (
    payload.iss !== expectedIssuer ||
    payload.aud !== AUDIENCE ||
    !["launch", "session", "capability"].includes(payload.kind) ||
    payload.exp <= now ||
    payload.iat > now + 30 ||
    (expectedKind && payload.kind !== expectedKind)
  ) {
    throw new Error("Expired or invalid Capital grant.");
  }
  createOwnerContext(payload.sub);
  return payload;
}

function consumeLaunchGrant(token: string): OwnerGrant {
  const grant = verifyOwnerGrant(token, "launch");
  const now = Math.floor(Date.now() / 1000);
  for (const [nonce, expiresAt] of consumedLaunchNonces) {
    if (expiresAt <= now) consumedLaunchNonces.delete(nonce);
  }
  if (consumedLaunchNonces.has(grant.nonce)) {
    throw new Error("Capital launch grant was already used.");
  }
  consumedLaunchNonces.set(grant.nonce, grant.exp);
  return grant;
}

export function exchangeLaunchGrantForSession(token: string): {
  ownerUserId: string;
  sessionToken: string;
} {
  const launch = consumeLaunchGrant(token);
  return {
    ownerUserId: launch.sub,
    sessionToken: issueOwnerGrant(launch.sub, "session"),
  };
}

function consumeCapabilityGrant(grant: OwnerGrant): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [nonce, expiresAt] of consumedCapabilityNonces) {
    if (expiresAt <= now) consumedCapabilityNonces.delete(nonce);
  }
  if (consumedCapabilityNonces.has(grant.nonce)) {
    throw new Error("Capital capability grant was already used.");
  }
  consumedCapabilityNonces.set(grant.nonce, grant.exp);
}

function cookieValue(req: Request): string {
  const raw = String(req.headers.cookie || "");
  for (const part of raw.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return "";
}

function tokenFrom(req: Request): string {
  const authorization = String(req.headers.authorization || "");
  if (authorization.startsWith("Bearer ")) return authorization.slice(7).trim();
  return cookieValue(req);
}

function attachOwner(req: Request, ownerUserId: string): void {
  const owner = createOwnerContext(ownerUserId);
  (req as any).user = { claims: { sub: owner.ownerUserId } };
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = tokenFrom(req);
    if (token) {
      const grant = verifyOwnerGrant(token);
      if (grant.kind !== "session" && grant.kind !== "capability") {
        throw new Error("Capital launch grant cannot authorize an API request.");
      }
      if (grant.kind === "capability") consumeCapabilityGrant(grant);
      attachOwner(req, grant.sub);
      runWithOwnerContext(grant.sub, next);
      return;
    }
    if (process.env.NODE_ENV !== "production" && process.env.CAPITAL_DEV_OWNER_ID?.trim()) {
      attachOwner(req, process.env.CAPITAL_DEV_OWNER_ID.trim());
      runWithOwnerContext(process.env.CAPITAL_DEV_OWNER_ID.trim(), next);
      return;
    }
    res.status(401).json({ error: "Authenticated ZCOS owner is required." });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : "Invalid Capital grant." });
  }
}

export function setupLocalAuth(app: Express): void {
  app.get("/auth/zcos", (req, res) => {
    try {
      const exchange = exchangeLaunchGrantForSession(String(req.query.token || ""));
      const nextPath = String(req.query.next || "/");
      const safeNext = ["/", "/budget", "/trading"].includes(nextPath) ? nextPath : "/";
      const sessionToken = exchange.sessionToken;
      const frontendOrigin = process.env.FRONTEND_URL?.trim().replace(/\/$/, "") || "";
      const crossOrigin = Boolean(frontendOrigin);

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: crossOrigin || process.env.NODE_ENV === "production",
        sameSite: crossOrigin ? "none" : "lax",
        maxAge: SESSION_TTL_SECONDS * 1000,
        path: "/",
      });
      res.redirect(303, frontendOrigin ? `${frontendOrigin}${safeNext}` : safeNext);
    } catch (error) {
      res.status(401).send(error instanceof Error ? error.message : "Invalid Capital grant.");
    }
  });

  app.get("/api/capital/me", isAuthenticated, (req, res) => {
    res.json({ user: { id: (req as any).user.claims.sub } });
  });

  app.post("/api/capital/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  });
}

export function resetConsumedLaunchGrantsForTests(): void {
  consumedLaunchNonces.clear();
  consumedCapabilityNonces.clear();
}
