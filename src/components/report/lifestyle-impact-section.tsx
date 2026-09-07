"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Cigarette,
  Dumbbell,
  GlassWater,
  Leaf,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  Utensils,
  Wind,
  type LucideIcon,
} from "lucide-react";

import {
  computePotentialScore,
  type CompositeBreakdown,
  type LifestyleModifier,
} from "@/lib/scoring/engine";

import { GlassCard } from "./glass-card";
import { InsightBubble } from "./insight-bubble";
import { buildCauseEffects, type ReportContext } from "./insights";
import { PotentialScoreCard } from "./potential-score-card";
import { LifestyleSimulator } from "./lifestyle-simulator";
import { REPORT_SPRING } from "./types";

/**
 * SPEC §8.4 — Lifestyle Impact Analysis.
 * Upgraded from punitive point deductions to a 3-tier value framework:
 * Tier 1: Potential Score Card (Dopamine & Goal Projection)
 * Tier 2: Interactive What-If Simulator (Active Empowerment)
 * Tier 3: Actionable Habit Breakdown with 24h Micro-Habit Quick Fixes
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

const FACTOR_QUICK_FIXES: Record<string, string> = {
  sleep: "Đặt báo thức đi ngủ trước 23h tối nay. Hạn chế nhìn màn hình điện thoại 30 phút trước khi ngủ.",
  water: "Chuẩn bị sẵn bình nước 1.5L – 2L ngay bàn làm việc. Uống 1 ly 300ml ngay sau khi thức dậy.",
  diet: "Uống trà xanh hoặc nước ép thay cho trà sữa, hạn chế tối đa dầu mỡ và đồ cay trong 3 ngày tới.",
  sunscreen: "Đặt tuýp kem chống nắng cạnh bàn chải đánh răng để tạo thói quen thoa 2 đốt ngón tay mỗi sáng.",
  smoking: "Bổ sung nhiều Vitamin C từ trái cây tươi (cam, kiwi) để bù đắp lượng collagen hao hụt.",
  exercise: "Duy trì 20 phút đi bộ nhanh hoặc cardio nhẹ mỗi ngày để kích thích vi tuần hoàn máu dưới da.",
  environment: "Sử dụng máy phun sương cấp ẩm mini tại bàn làm việc và xịt khoáng dưỡng ẩm mỗi 3 tiếng.",
  stress: "Dành 10 phút hít thở sâu theo phương pháp 4-7-8 trước khi đi ngủ để hạ nồng độ cortisol.",
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
  /** Composite score before modifiers */
  compositeScore?: number;
  /** Final calculated score */
  overallScore?: number;
  onNextTab?: () => void;
};

export function LifestyleImpactSection({
  mods,
  totalApplied,
  totalRaw,
  ctx,
  breakdown,
  compositeScore,
  overallScore,
  onNextTab,
}: Props) {
  const causeEffects = buildCauseEffects(ctx, breakdown);
  const wasCapped = totalRaw !== totalApplied;

  const baseComposite = compositeScore ?? 75;
  const currentOverall =
    overallScore ?? Math.round(baseComposite + totalApplied);
  const potentialResult = computePotentialScore(baseComposite, mods);

  return (
    <section className="space-y-4">
      <Header totalApplied={totalApplied} />

      {/* ── Tầng 1: Potential Score Card ───────────────────────────── */}
      <PotentialScoreCard
        currentScore={currentOverall}
        potentialScore={potentialResult.potentialScore}
        delta={potentialResult.delta}
        potentialBand={potentialResult.potentialBand}
      />

      {/* ── Tầng 2: Interactive What-If Simulator ──────────────────── */}
      <LifestyleSimulator
        initialScore={currentOverall}
        compositeScore={baseComposite}
        mods={mods}
        ctx={ctx}
        breakdown={breakdown}
      />

      {/* ── Tầng 3: Actionable Habit Breakdown ─────────────────────── */}
      <div className="pt-2">
        <h3 className="mb-2.5 px-1 text-[14px] font-semibold tracking-tight text-foreground/90">
          Chi tiết tác động từ lối sống
        </h3>

        {mods.length === 0 ? (
          <GlassCard className="flex items-center gap-3 p-4">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-white/65">
              <Leaf className="size-4 text-emerald-600" strokeWidth={2.2} />
            </span>
            <p className="text-[13px] leading-relaxed text-foreground/70">
              Chưa thấy thói quen nào đáng kể tác động tiêu cực đến điểm hôm
              nay — bạn đang giữ nhịp sống rất điều độ!
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2.5">
            {mods.map((m, i) => {
              const Icon = FACTOR_ICONS[m.factor] ?? AlertCircle;
              const positive = m.value > 0;
              const tint = positive
                ? "color-mix(in srgb, #2ECC71 18%, rgba(255,255,255,0.55))"
                : "color-mix(in srgb, #E74C3C 16%, rgba(255,255,255,0.55))";
              const valueColor = positive ? "#15803d" : "#b91c1c";
              const quickFix = FACTOR_QUICK_FIXES[m.factor];

              return (
                <motion.div
                  key={`${m.factor}-${i}`}
                  initial={{ opacity: 0, x: positive ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...REPORT_SPRING, delay: 0.12 + i * 0.05 }}
                >
                  <GlassCard className="p-4" tint={tint}>
                    <div className="flex items-start gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/70"
                        style={{
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                        }}
                      >
                        <Icon
                          className="size-4 text-foreground/75"
                          strokeWidth={2.2}
                        />
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

                        {/* Actionable Micro-Habit / Quick Fix */}
                        {!positive && quickFix && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-900">
                            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                            <div>
                              <span className="font-bold">Gợi ý 24h tới:</span>{" "}
                              {quickFix}
                            </div>
                          </div>
                        )}
                        {positive && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 p-2.5 text-[11px] leading-relaxed text-emerald-900">
                            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                            <div>
                              <span className="font-bold">Duy trì:</span> Thói
                              quen vàng này đang bảo vệ làn da của bạn mỗi ngày!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {wasCapped && (
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-foreground/55">
            Tổng điểm thói quen được khóa trong khoảng ±20 (thực tế:{" "}
            {totalRaw >= 0 ? "+" : ""}
            {totalRaw}).
          </p>
        )}
      </div>

      {/* ── Cause & Effect Block ───────────────────────────────────── */}
      <CauseEffectsBlock items={causeEffects} />

      {/* Guided Funnel Next Step CTA */}
      {onNextTab && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNextTab}
            className="flex h-13 w-full items-center justify-between px-5 rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50/90 via-white/80 to-amber-50/80 hover:from-rose-100 hover:to-amber-100 text-foreground shadow-sm transition-all active:scale-98"
            style={{
              boxShadow:
                "0 8px 24px rgba(244, 63, 94, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
            }}
          >
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                Bước quan trọng nhất
              </p>
              <p className="text-[13px] font-bold text-foreground">
                Xem Phác Đồ Routine Phù Hợp Với Bạn ✨
              </p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-700">
              <ArrowRight className="size-4" />
            </span>
          </button>
        </div>
      )}
    </section>
  );
}

function CauseEffectsBlock({
  items,
}: {
  items: ReturnType<typeof buildCauseEffects>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="pt-2">
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
    <header className="flex items-baseline justify-between px-1">
      <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
        Lifestyle Đang Tác Động Ra Sao?
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
