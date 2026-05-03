"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef } from "react";
import type { LucideIcon } from "lucide-react";

export type SliderVibe = {
  label: string;
  emoji: string;
};

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  icon: LucideIcon;
  label: string;
  display: string;
  fillFrom: string;
  fillTo: string;
  /** Dynamic vibe shown beneath the track — re-keys to animate on change. */
  vibe: SliderVibe;
  /** Tint of the icon bubble interior — defaults to a neutral white wash. */
  iconTint?: string;
};

export function LiquidGlassSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  icon: Icon,
  label,
  display,
  fillFrom,
  fillTo,
  vibe,
  iconTint = "rgba(255,255,255,0.7)",
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width)
      );
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.min(max, Math.max(min, stepped));
      const rounded = Number(clamped.toFixed(2));
      if (rounded !== value) onChange(rounded);
    },
    [min, max, step, onChange, value]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  const pct = ((value - min) / (max - min)) * 100;
  // Brightness ramps up as the user drags the fill — adds a halo on top of
  // the base gradient so the track visibly "lights up" from the back.
  const haloOpacity = 0.15 + (pct / 100) * 0.55;

  return (
    <div className="space-y-2.5">
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        tabIndex={0}
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            onChange(Math.min(max, value + step));
            e.preventDefault();
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            onChange(Math.max(min, value - step));
            e.preventDefault();
          }
        }}
        className="relative h-[76px] w-full cursor-pointer touch-none select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
        style={{
          borderRadius: "1.75rem",
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.25), 0 10px 28px rgba(31,38,135,0.10)",
        }}
      >
        {/* Colored fill — width tracks pct */}
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0"
          style={{
            background: `linear-gradient(90deg, ${fillFrom}, ${fillTo})`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
          animate={{ width: `${pct}%` }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 28,
            mass: 0.7,
          }}
        />

        {/* Brightening halo — opacity ramps with pct */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 50%, ${fillTo} 0%, transparent 70%)`,
            mixBlendMode: "screen",
          }}
          animate={{
            width: `${Math.min(100, pct + 8)}%`,
            opacity: haloOpacity,
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
            mass: 0.7,
          }}
        />

        {/* Specular highlight strip */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.92), transparent)",
          }}
        />

        <div className="pointer-events-none relative z-10 flex h-full items-center justify-between px-4 pr-5">
          <span className="flex items-center gap-3 text-foreground/80">
            {/* Squircle icon bubble */}
            <span
              className="flex size-11 items-center justify-center text-foreground/85"
              style={{
                borderRadius: "0.95rem",
                background: iconTint,
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 12px rgba(31,38,135,0.10)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              <Icon className="size-[19px]" />
            </span>
            <span className="text-[13px] font-semibold tracking-tight">
              {label}
            </span>
          </span>
          <span className="text-[18px] font-semibold tabular-nums tracking-tight text-foreground">
            {display}
          </span>
        </div>
      </div>

      {/* Dynamic vibe text — re-keyed on label so it animates on change */}
      <div className="px-1.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={vibe.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 text-[12px] font-medium leading-snug text-foreground/60"
          >
            <span aria-hidden className="text-[14px] leading-none">
              {vibe.emoji}
            </span>
            <span>{vibe.label}</span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
