"use client";

import { motion } from "framer-motion";
import { useCallback, useRef } from "react";
import type { LucideIcon } from "lucide-react";

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
};

export function ControlCenterSlider({
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
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
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

  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
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
      className="relative h-20 w-full cursor-pointer touch-none select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
      style={{
        borderRadius: "1.5rem",
        background: "rgba(255,255,255,0.45)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.25), 0 8px 24px rgba(31,38,135,0.08)",
      }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{
          background: `linear-gradient(90deg, ${fillFrom}, ${fillTo})`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />

      <div className="pointer-events-none relative z-10 flex h-full items-center justify-between px-5">
        <span className="flex items-center gap-2.5 text-foreground/75">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-white/70 text-foreground/80"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
          >
            <Icon className="size-[18px]" />
          </span>
          <span className="text-[13px] font-semibold tracking-tight">
            {label}
          </span>
        </span>
        <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
          {display}
        </span>
      </div>
    </div>
  );
}
