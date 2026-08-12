import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, History } from "lucide-react";
import { useLocation } from "wouter";

import ZillionCelestialCore, { type NexysDomain } from "./ZillionCelestialCore";
import { ProsperDock } from "./ProsperDock";
import { configuredPortalOrigin, zcosContextUrl, ZILLION_DOMAINS, type ZillionDomain } from "./galaxyManifest";

function domainFromScene(domain: NexysDomain): ZillionDomain {
  return ZILLION_DOMAINS.find((item) => item.id === domain.id) || ZILLION_DOMAINS[0];
}

export function ZillionGalaxyPage() {
  const [, navigate] = useLocation();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focused = useMemo(
    () => ZILLION_DOMAINS.find((domain) => domain.id === focusedId) ?? null,
    [focusedId],
  );
  const portalOrigin = configuredPortalOrigin();
  const historyUrl = zcosContextUrl("/history");

  function focus(domain: NexysDomain) {
    setFocusedId(domain.id);
  }

  function open(domain: ZillionDomain) {
    navigate(domain.route);
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,#06201b_0%,#04110f_52%,#010504_100%)] text-white">
      <div className="absolute inset-0" data-testid="zillion-galaxy">
        <ZillionCelestialCore
          domains={[...ZILLION_DOMAINS]}
          label="ZILLION"
          atmosphere={focused?.color || "#34d399"}
          focusMode={Boolean(focused)}
          focusedDomainId={focused?.id || null}
          zoom={focused ? 1.8 : 1}
          particleCount={16000}
          onDomainSelect={(domain) => focus(domain)}
          onFocusedTap={(domain) => open(domainFromScene(domain))}
          onCoreTap={() => setFocusedId(null)}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_44%,rgba(52,211,153,0.14),transparent_72%)]"
        aria-hidden="true"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => portalOrigin && window.location.assign(portalOrigin)}
            disabled={!portalOrigin}
            className="btn-touch inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 text-[11px] font-medium tracking-[0.12em] text-white/75 backdrop-blur"
          >
            <ArrowLeft size={14} /> ZCOS
          </button>
          {historyUrl && (
            <a href={historyUrl} className="btn-touch inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 text-[11px] text-white/65 backdrop-blur">
              <History size={14} /> History
            </a>
          )}
        </div>
        <div className="rounded-full border border-emerald-200/15 bg-black/35 px-3 py-2 text-right backdrop-blur">
          <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-emerald-300">PROSPER</div>
          <div className="text-[10px] text-white/55">CAPITAL Desk</div>
        </div>
      </header>

      {focused && (
        <section className="absolute inset-x-4 bottom-[9.25rem] z-20 mx-auto max-w-md rounded-2xl border border-white/12 bg-black/58 p-4 backdrop-blur-2xl motion-safe:animate-[nexys-settle_300ms_ease-out]">
          <button
            type="button"
            onClick={() => setFocusedId(null)}
            className="mb-2 inline-flex items-center gap-1 text-xs text-white/55"
          >
            <ArrowLeft size={13} /> All domains
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: focused.color }}>
                {focused.authority}
              </div>
              <h2 className="mt-1 text-xl font-semibold">{focused.title}</h2>
              <p className="mt-1 text-sm leading-5 text-white/58">{focused.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => open(focused)}
              className="btn-touch flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 text-xs text-emerald-100"
              aria-label={"Open " + focused.title}
            >
              Open <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      <ProsperDock />
    </div>
  );
}
