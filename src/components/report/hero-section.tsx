"use client";

import { motion } from "framer-motion";

import { GlassCard } from "./glass-card";
import { ScoreGauge } from "./score-gauge";
import { REPORT_SPRING, type ScanReportScoreBand } from "./types";

/**
 * SPEC §8.1 — Hero Section.
 *
 * Wraps the greeting, the animated gauge, the band/skin-type badges, and
 * the band's curated message (§7.C copy). Adaptive tint is sourced from
 * the `--score-color` CSS var set on the report root, so this component
 * stays oblivious to the actual hex.
 */
type Props = {
  userName: string;
  overallScore: number;
  scoreBand: ScanReportScoreBand;
  /** From onboarding — `null` when the user skipped that step. */
  skinType: string | null;
};

export function HeroSection({
  userName,
  overallScore,
  scoreBand,
  skinType,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={REPORT_SPRING}
    >
      <GlassCard
        className="px-6 pb-6 pt-5"
        tint="color-mix(in srgb, var(--score-color) 12%, rgba(255,255,255,0.65))"
      >
        {/* Subtle band-tinted halo behind the gauge — keeps the depth
            cue without darkening the readable copy on top. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-24 h-56 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--score-color) 55%, transparent), transparent 70%)",
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65">
            <span
              className="size-1.5 rounded-full"
              style={{ background: "var(--score-color)" }}
            />
            Skin Health Report
          </span>

          <h1 className="mt-2 text-balance text-[26px] font-semibold leading-[1.1] tracking-tight text-foreground">
            Chào {userName || "bạn"}, đây là Skin Report của bạn{" "}
            <span aria-hidden>🌟</span>
          </h1>

          <div className="mt-6 flex justify-center">
            <ScoreGauge score={overallScore} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
              style={{
                background: "var(--score-color)",
                boxShadow:
                  "0 8px 24px color-mix(in srgb, var(--score-color) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              <span aria-hidden>{scoreBand.emoji} </span>
              {scoreBand.label}
            </span>
            {skinType && (
              <span className="rounded-full border border-white/55 bg-white/65 px-3 py-1.5 text-[12px] font-semibold text-foreground/85">
                {skinType}
              </span>
            )}
          </div>

          <p className="mt-4 text-center text-[14px] leading-relaxed text-foreground/75">
            {scoreBand.message}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
