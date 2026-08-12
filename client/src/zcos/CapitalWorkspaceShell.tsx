import type { ReactNode } from "react";
import { ChevronLeft, History } from "lucide-react";
import { useLocation } from "wouter";

import { ProsperDock } from "./ProsperDock";
import { zcosContextUrl } from "./galaxyManifest";

export function CapitalWorkspaceShell({
  title,
  eyebrow = "ZILLION · PROSPER",
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const [, navigate] = useLocation();
  const historyUrl = zcosContextUrl("/history");
  return (
    <div className="min-h-[100dvh] bg-[#02050b] text-white">
      <header className="sticky top-0 z-30 border-b border-emerald-200/10 bg-[#02050b]/88 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/galaxy/zillion")}
              className="btn-touch inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-white/70"
            >
              <ChevronLeft size={15} /> Galaxy
            </button>
            {historyUrl && (
              <a href={historyUrl} className="btn-touch inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-white/60">
                <History size={14} /> <span className="hidden sm:inline">History</span>
              </a>
            )}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-300/70">{eyebrow}</div>
            <h1 className="truncate text-sm font-semibold">{title}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-36 pt-5">{children}</main>
      <ProsperDock />
    </div>
  );
}
