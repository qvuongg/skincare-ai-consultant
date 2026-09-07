"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { GlassCard } from "./glass-card";
import type { ReportContext } from "./insights";
import { ScoreGauge } from "./score-gauge";
import { REPORT_SPRING, type ScanReportScoreBand } from "./types";

/**
 * SPEC §8.1 — Hero Section.
 *
 * Headline reframes `overall_score` as goal-progress %, so the user sees
 * "the scan is X% of the way to my goal" instead of a bare diagnostic
 * number. Falls back to a neutral greeting when `goalLabel` is null.
 *
 * The context glass box (§8.1 personalization) lists the onboarding
 * fields actually used to compute the score — only the non-null fields
 * are stitched into the sentence so users who skipped optional steps
 * don't see "làm việc tại null".
 */
type Props = {
  ctx: ReportContext;
  overallScore: number;
  scoreBand: ScanReportScoreBand;
  /** Self-reported skin type, displayed as the secondary badge. */
  skinType: string | null;
};

export function HeroSection({ ctx, overallScore, scoreBand, skinType }: Props) {
  const headline = buildHeadline(ctx, overallScore);
  const contextSentence = buildContextSentence(ctx);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={REPORT_SPRING}
    >
      <GlassCard
        className="px-6 pb-6 pt-5"
        tint="linear-gradient(180deg, color-mix(in srgb, var(--score-color) 14%, rgba(255,255,255,0.92)) 0%, rgba(255,255,255,0.75) 100%)"
        style={{
          boxShadow:
            "0 20px 48px rgba(31, 38, 135, 0.09), 0 4px 16px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
        }}
      >
        {/* Top reflection ray */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)",
          }}
        />

        {/* Adaptive band-tinted halo behind the gauge. */}
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

          <h1 className="mt-2 text-balance text-[24px] font-semibold leading-[1.15] tracking-tight text-foreground">
            {headline}
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

          {contextSentence && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...REPORT_SPRING, delay: 0.18 }}
              className="mt-5 flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed text-foreground/75"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.45)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              <Sparkles
                className="mt-0.5 size-3.5 shrink-0 text-foreground/55"
                strokeWidth={2.2}
              />
              <span>{contextSentence}</span>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Copy builders — pure, exported only for unit-test access if needed.
// ────────────────────────────────────────────────────────────────────────

function buildHeadline(ctx: ReportContext, overallScore: number): string {
  const name = ctx.userName || "bạn";
  const score = Math.round(overallScore);
  if (ctx.goalLabel) {
    // No trailing period — `%` already terminates the sentence and "%."
    // reads slightly off in Vietnamese.
    return `Mục tiêu ${ctx.goalLabel} của ${name} đang hoàn thành ${score}%`;
  }
  // Neutral fallback when the user skipped goal selection — don't
  // fabricate a goal just to keep the sentence shape.
  return `Skin Report của ${name} — điểm hiện tại ${score}/100`;
}

/**
 * Build the "dựa trên bối cảnh" sentence from whichever fields are
 * present. Returns `null` when there's nothing to say.
 */
function buildContextSentence(ctx: ReportContext): string | null {
  const parts: string[] = [];
  if (ctx.ageLabel) parts.push(`${ctx.ageLabel} tuổi`);
  if (ctx.location) parts.push(`sống tại ${ctx.location}`);
  if (ctx.workEnvLabel) parts.push(`làm việc tại ${ctx.workEnvLabel}`);
  if (parts.length === 0) return null;
  // Vietnamese natural-list join: "A, B và C" / "A và B" / "A".
  let joined: string;
  if (parts.length === 1) {
    joined = parts[0];
  } else {
    const head = parts.slice(0, -1).join(", ");
    joined = `${head} và ${parts[parts.length - 1]}`;
  }
  return `Kết quả này được Mika phân tích dựa trên bối cảnh: ${joined}.`;
}
