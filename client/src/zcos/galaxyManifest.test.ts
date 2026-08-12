import { describe, expect, it } from "vitest";

import {
  PROSPER_DOCK_LABELS,
  ZILLION_DOMAINS,
  zillionDomainById,
} from "./galaxyManifest";

describe("ZILLION galaxy contract", () => {
  it("exposes exactly the seven shared ZCOS domains", () => {
    expect(ZILLION_DOMAINS.map((domain) => domain.id)).toEqual([
      "identity",
      "memory",
      "knowledge",
      "apps",
      "desk",
      "settings",
      "portal",
    ]);
    expect(new Set(ZILLION_DOMAINS.map((domain) => domain.route)).size).toBe(7);
  });

  it("resolves Desk to CAPITAL without adding Capital as a planet", () => {
    expect(zillionDomainById("desk")).toMatchObject({
      label: "DESK",
      title: "CAPITAL Desk",
      route: "/capital",
      authority: "ZILLION",
    });
    expect(ZILLION_DOMAINS.some((domain) => domain.id === ("capital" as never))).toBe(false);
  });

  it("keeps PROSPER to the approved five controls and order", () => {
    expect(PROSPER_DOCK_LABELS).toEqual(["Chat", "Upload", "Budget", "Trade", "Invest"]);
    expect(PROSPER_DOCK_LABELS).toHaveLength(5);
  });
});
