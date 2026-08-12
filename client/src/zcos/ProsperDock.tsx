import { useEffect, useRef, useState } from "react";
import { Landmark, LineChart, MessageCircle, TrendingUp, Upload } from "lucide-react";
import { useLocation } from "wouter";

import { PROSPER_DOCK_LABELS } from "./galaxyManifest";

const CONTROLS = [
  { label: "Chat", icon: MessageCircle, route: "/capital/chat" },
  { label: "Upload", icon: Upload, route: "/capital/upload" },
  { label: "Budget", icon: Landmark, route: "/capital/budget" },
  { label: "Trade", icon: LineChart, route: null },
  { label: "Invest", icon: TrendingUp, route: "/capital/invest" },
] as const;

if (CONTROLS.map((control) => control.label).join("|") !== PROSPER_DOCK_LABELS.join("|")) {
  throw new Error("PROSPER Dock contract mismatch.");
}

export function ProsperDock() {
  const [, navigate] = useLocation();
  const [tradeOpen, setTradeOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tradeOpen) return;
    const close = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setTradeOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [tradeOpen]);

  return (
    <div
      ref={dockRef}
      className="prosper-dock-wrap"
      data-testid="prosper-dock"
      aria-label="PROSPER Dock"
    >
      {tradeOpen && (
        <div className="prosper-trade-choice" role="group" aria-label="Trade environment">
          <button type="button" onClick={() => navigate("/capital/trade/live")}>LIVE</button>
          <button type="button" onClick={() => navigate("/capital/trade/simulation")}>SIMULATION</button>
        </div>
      )}
      <nav className="prosper-dock" aria-label="PROSPER controls">
        {CONTROLS.map((control) => {
          const Icon = control.icon;
          const expanded = control.label === "Trade" && tradeOpen;
          return (
            <button
              key={control.label}
              type="button"
              className={expanded ? "is-active" : ""}
              aria-expanded={control.label === "Trade" ? expanded : undefined}
              onClick={() => {
                if (control.label === "Trade") {
                  setTradeOpen((value) => !value);
                  return;
                }
                setTradeOpen(false);
                if (control.route) navigate(control.route);
              }}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{control.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
