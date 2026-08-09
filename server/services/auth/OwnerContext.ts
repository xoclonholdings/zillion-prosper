import type { Request } from "express";

const PROHIBITED_OWNER_IDS = new Set(["user", "user_001", "default-user", "anonymous", "admin-user", "unknown"]);

export interface OwnerContext {
  ownerUserId: string;
  source: "authenticated_session";
}

export function createOwnerContext(ownerUserId: unknown): OwnerContext {
  const owner = typeof ownerUserId === "string" ? ownerUserId.trim() : "";
  if (!owner || PROHIBITED_OWNER_IDS.has(owner.toLowerCase())) {
    throw new Error("Authenticated ZCOS owner is required.");
  }
  return { ownerUserId: owner, source: "authenticated_session" };
}

export function ownerUserIdFromAuthenticatedRequest(req: Request): string {
  return createOwnerContext((req as any)?.user?.claims?.sub).ownerUserId;
}
