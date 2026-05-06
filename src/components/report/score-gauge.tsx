"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";

import { REPORT_SPRING } from "./types";

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Animated circular score gauge per SPEC §8.1.2.
 *
 *   - One MotionValue (`progress`) drives both the SVG stroke-dashoffset
 *     and the rendered integer — single source of truth keeps the ring
 *     and the number locked in sync at every frame.
 *   - Spring config is the project default (220/26) so the snap matches
 *     the rest of the Liquid Glass language.
 *   - Color comes from the `--score-color` CSS var the report root sets
 *     so the gauge re-tints automatically if the band changes.
 */
export function ScoreGauge({ score }: { score: number }) {
  const target = Math.max(0, Math.min(100, Math.round(score)));

  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => CIRCUMFERENCE * (1 - v / 100)
  );

  const [shown, setShown] = useState(0);
  useMotionValueEvent(progress, "change", (latest) => {
    setShown(Math.round(latest));
  });

  useEffect(() => {
    const controls = animate(progress, target, {
      ...REPORT_SPRING,
      // Tiny lead-in so the user catches the start of the sweep instead
      // of seeing the gauge already mid-animation when the layout settles.
      delay: 0.18,
    });
    return () => controls.stop();
  }, [progress, target]);

  return (
    <div className="relative size-[200px]">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="10"
        />
        {/* Progress — color via CSS var so the parent's adaptive tint
            (set on the report root) flows through without re-rendering. */}
        <motion.circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="var(--score-color)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            strokeDashoffset: dashOffset,
            filter:
              "drop-shadow(0 0 14px color-mix(in srgb, var(--score-color) 70%, transparent))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[52px] font-semibold leading-none tabular-nums tracking-tight"
          style={{ color: "var(--score-color)" }}
        >
          {shown}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          / 100 điểm
        </span>
      </div>
    </div>
  );
}
