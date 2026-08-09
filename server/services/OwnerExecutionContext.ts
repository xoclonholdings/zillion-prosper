import { AsyncLocalStorage } from "async_hooks";

import { createOwnerContext } from "./auth/OwnerContext";

const ownerStorage = new AsyncLocalStorage<string>();

export function runWithOwnerContext<T>(ownerUserId: string, callback: () => T): T {
  const owner = createOwnerContext(ownerUserId);
  return ownerStorage.run(owner.ownerUserId, callback);
}

export function currentOwnerUserId(): string {
  return createOwnerContext(ownerStorage.getStore()).ownerUserId;
}
