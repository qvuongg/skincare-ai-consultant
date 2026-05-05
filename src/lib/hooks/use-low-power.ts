"use client";

import { useEffect, useState } from "react";

// Coarse "low-power" gate used to simplify or disable expensive visual
// effects on devices that either prefer reduced motion or are running on
// small mobile viewports (proxy for limited GPU + thermal headroom).
//
// SSR-safe: returns `{ reduced: false, isMobile: false }` on the first
// render so the markup matches the server output, then re-renders with
// the real values after mount.
export function useLowPower(): { reduced: boolean; isMobile: boolean } {
  const [state, setState] = useState({ reduced: false, isMobile: false });

  useEffect(() => {
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(max-width: 640px)");

    const sync = () =>
      setState({ reduced: reducedMq.matches, isMobile: mobileMq.matches });

    sync();
    reducedMq.addEventListener("change", sync);
    mobileMq.addEventListener("change", sync);
    return () => {
      reducedMq.removeEventListener("change", sync);
      mobileMq.removeEventListener("change", sync);
    };
  }, []);

  return state;
}
