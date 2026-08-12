import {
  AppWindow,
  Brain,
  Fingerprint,
  Landmark,
  Network,
  Orbit,
  Settings,
} from "lucide-react";

import type { NexysDomain } from "./ZillionCelestialCore";

export type ZillionDomainId =
  | "identity"
  | "memory"
  | "knowledge"
  | "apps"
  | "desk"
  | "settings"
  | "portal";

export interface ZillionDomain extends NexysDomain {
  id: ZillionDomainId;
  title: string;
  summary: string;
  route: string;
  authority: "ZCOS" | "ZILLION";
}

export const ZILLION_DOMAINS: readonly ZillionDomain[] = Object.freeze([
  {
    id: "identity",
    label: "IDENTITY",
    title: "Identity",
    summary: "Your one ZCOS identity, available inside ZILLION without creating a finance-only profile.",
    route: "/domain/identity",
    authority: "ZCOS",
    color: "#8de9ff",
    size: 0.24,
    radius: 4.8,
    inclination: -0.34,
    angle: 0.48,
    icon: Fingerprint,
  },
  {
    id: "memory",
    label: "MEMORY",
    title: "Memory",
    summary: "The ZILLION partition of the central ZCOS Memory authority.",
    route: "/domain/memory",
    authority: "ZCOS",
    color: "#bc8cff",
    size: 0.19,
    radius: 3.25,
    inclination: 0.56,
    angle: 2.43,
    icon: Brain,
  },
  {
    id: "knowledge",
    label: "KNOWLEDGE",
    title: "Knowledge",
    summary: "Source-backed Capital understanding with ZILLION provenance and ZCOS governance.",
    route: "/domain/knowledge",
    authority: "ZCOS",
    color: "#56b7ff",
    size: 0.28,
    radius: 6.1,
    inclination: 0.18,
    angle: 4.91,
    icon: Network,
    ring: true,
  },
  {
    id: "apps",
    label: "APPS",
    title: "Apps",
    summary: "ZCOS Extensions available to the same unified identity from every galaxy.",
    route: "/domain/apps",
    authority: "ZCOS",
    color: "#f3b65b",
    size: 0.17,
    radius: 2.65,
    inclination: -0.63,
    angle: 5.64,
    icon: AppWindow,
  },
  {
    id: "desk",
    label: "DESK",
    title: "CAPITAL Desk",
    summary: "Budgeting, Trading, and Investing - ZILLION's specialized working domain.",
    route: "/capital",
    authority: "ZILLION",
    color: "#34d399",
    size: 0.32,
    radius: 4.05,
    inclination: 0.37,
    angle: 3.52,
    icon: Landmark,
    moon: true,
  },
  {
    id: "settings",
    label: "SETTINGS",
    title: "Settings",
    summary: "Simple account and system controls governed by ZCOS.",
    route: "/domain/settings",
    authority: "ZCOS",
    color: "#7dd3fc",
    size: 0.2,
    radius: 5.42,
    inclination: -0.08,
    angle: 1.61,
    icon: Settings,
  },
  {
    id: "portal",
    label: "PORTAL",
    title: "Portal",
    summary: "Return to the ZCOS constellation without changing identity or Capital ownership.",
    route: "/domain/portal",
    authority: "ZCOS",
    color: "#f472b6",
    size: 0.22,
    radius: 6.65,
    inclination: 0.72,
    angle: 0.96,
    icon: Orbit,
  },
]);

export const PROSPER_DOCK_LABELS = Object.freeze([
  "Chat",
  "Upload",
  "Budget",
  "Trade",
  "Invest",
] as const);

export function zillionDomainById(id: string | null | undefined): ZillionDomain | null {
  return ZILLION_DOMAINS.find((domain) => domain.id === id) ?? null;
}

export function configuredZarOrigin(): string {
  return String(import.meta.env.VITE_ZAR_APP_URL || import.meta.env.VITE_ZAR_API_URL || "")
    .trim()
    .replace(/\/$/, "");
}

export function configuredPortalOrigin(): string {
  return String(import.meta.env.VITE_ZCOS_PORTAL_URL || configuredZarOrigin())
    .trim()
    .replace(/\/$/, "");
}

export function zcosContextUrl(path: string, extra: Record<string, string> = {}): string | null {
  const origin = configuredZarOrigin();
  if (!origin) return null;
  const url = new URL(path, origin + "/");
  url.searchParams.set("galaxy", "ZILLION");
  url.searchParams.set("desk", "CAPITAL");
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  return url.toString();
}
