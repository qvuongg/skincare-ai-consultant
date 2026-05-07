"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Brain,
  Cigarette,
  Dumbbell,
  GlassWater,
  Leaf,
  Moon,
  Sun,
  Utensils,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type {
  CompositeBreakdown,
  LifestyleModifier,
} from "@/lib/scoring/engine";

import { GlassCard } from "./glass-card";
import { InsightBubble } from "./insight-bubble";
import { buildCauseEffects, type ReportContext } from "./insights";
import { REPORT_SPRING } from "./types";

/**
 * SPEC §8.4 — Lifestyle Impact Analysis. Renders the engine's modifier
 * breakdown so the user sees explicitly which habits earned them ± points
 * (the "xAI" requirement in §3.2.2).
 */
const FACTOR_ICONS: Record<string, LucideIcon> = {
  sleep: Moon,
  water: GlassWater,
  diet: Utensils,
  stress: Brain,
  sunscreen: Sun,
  smoking: Cigarette,
  exercise: Dumbbell,
  environment: Wind,
};

const FACTOR_LABELS: Record<string, string> = {
  sleep: "Giấc ngủ",
  water: "Uống nước",
  diet: "Chế độ ăn",
  stress: "Mức stress",
  sunscreen: "Chống nắng",
  smoking: "Hút thuốc",
  exercise: "Vận động",
  environment: "Môi trường",
};

type Props = {
  mods: LifestyleModifier[];
  /** Capped total (the value actually applied to the composite). */
  totalApplied: number;
  /** Uncapped sum (for the §8.4.5 potential projection). */
  totalRaw: number;
  /** Onboarding context — drives the "Cause & Effect" subsection. */
  ctx: ReportContext;
  /** Direction-corrected metric scores — feeds the "habit → metric" lines. */
  breakdown: CompositeBreakdown;
};

export function LifestyleImpactSection({
  mods,
  totalApplied,
  totalRaw,
  ctx,
  breakdown,
}: Props) {
  const causeEffects = buildCauseEffects(ctx, breakdown);
  // No modifiers fired → render a single neutral card so the section
  // doesn't disappear silently and confuse the user. Cause-effect block
  // still renders below so we don't lose the "habit → metric" narrative.
  if (mods.length === 0) {
    return (
      <section>
        <Header totalApplied={0} />
        <GlassCard className="flex items-center gap-3 p-4">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-white/65">
            <Leaf className="size-4 text-emerald-600" strokeWidth={2.2} />
          </span>
          <p className="text-[13px] leading-relaxed text-foreground/70">
            Chưa thấy thói quen nào đáng kể tác động đến điểm hôm nay — duy trì
            nhịp sống hiện tại nha!
          </p>
        </GlassCard>
        <CauseEffectsBlock items={causeEffects} />
      </section>
    );
  }

  const wasCapped = totalRaw !== totalApplied;

  return (
    <section>
      <Header totalApplied={totalApplied} />

      <div className="space-y-2">
        {mods.map((m, i) => {
          const Icon = FACTOR_ICONS[m.factor] ?? AlertCircle;
          const positive = m.value > 0;
          const tint = positive
            ? "color-mix(in srgb, #2ECC71 18%, rgba(255,255,255,0.55))"
            : "color-mix(in srgb, #E74C3C 16%, rgba(255,255,255,0.55))";
          const valueColor = positive ? "#15803d" : "#b91c1c";

          return (
            <motion.div
              key={`${m.factor}-${i}`}
              initial={{ opacity: 0, x: positive ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...REPORT_SPRING, delay: 0.12 + i * 0.05 }}
            >
              <GlassCard className="flex items-start gap-3 p-4" tint={tint}>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/70"
                  style={{
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon className="size-4 text-foreground/75" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-semibold tracking-tight text-foreground">
                      {FACTOR_LABELS[m.factor] ?? m.factor}
                    </p>
                    <span
                      className="text-[15px] font-semibold tabular-nums leading-none"
                      style={{ color: valueColor }}
                    >
                      {positive ? "+" : ""}
                      {m.value}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-foreground/70">
                    {m.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-white/55 bg-white/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/60">
                      {m.metric_affected}
                    </span>
                    {m.is_red_flag && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700">
                        🚩 Red flag
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {wasCapped && (
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-foreground/55">
          Tổng điểm thói quen được khóa trong khoảng ±20 (thực tế:{" "}
          {totalRaw >= 0 ? "+" : ""}
          {totalRaw}).
        </p>
      )}

      <CauseEffectsBlock items={causeEffects} />
    </section>
  );
}

/**
 * SPEC §8.4 cause-and-effect — habit ↔ metric ties (separate from the
 * §7.B modifier list above, which is "your habit cost you N points").
 * Reads as: "your habit is producing this number." Renders nothing when
 * the engine couldn't pair any habit to a metric (e.g. user skipped both
 * water and diet questions).
 */
function CauseEffectsBlock({
  items,
}: {
  items: ReturnType<typeof buildCauseEffects>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="mb-2 px-1 text-[13px] font-semibold tracking-tight text-foreground/85">
        Thói quen đang tạo nên các chỉ số
      </h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...REPORT_SPRING, delay: 0.18 + i * 0.06 }}
          >
            <InsightBubble tone={it.tone}>{it.text}</InsightBubble>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Header({ totalApplied }: { totalApplied: number }) {
  return (
    <header className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
        Lifestyle đang tác động ra sao?
      </h2>
      <span className="text-[12px] tabular-nums text-foreground/65">
        Tổng:&nbsp;
        <span
          className="font-semibold"
          style={{
            color: totalApplied >= 0 ? "#15803d" : "#b91c1c",
          }}
        >
          {totalApplied >= 0 ? "+" : ""}
          {totalApplied}
        </span>
      </span>
    </header>
  );
}
