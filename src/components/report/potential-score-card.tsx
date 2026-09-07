"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import type { ScoreBand } from "@/lib/scoring/engine";
import { REPORT_SPRING } from "./types";

type Props = {
  currentScore: number;
  potentialScore: number;
  delta: number;
  potentialBand: ScoreBand;
};

export function PotentialScoreCard({
  currentScore,
  potentialScore,
  delta,
  potentialBand,
}: Props) {
  const hasGain = delta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay: 0.08 }}
      className="relative overflow-hidden rounded-[26px] p-5"
      style={{
        background: hasGain
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(240, 253, 244, 0.55) 50%, rgba(254, 243, 199, 0.45) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(240, 249, 255, 0.5) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.75)",
        boxShadow:
          "0 16px 36px rgba(31, 38, 135, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Top light reflection line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)",
        }}
      />

      {/* Header pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Sparkles className="size-3.5" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60">
            Tiềm Năng Phục Hồi Làn Da
          </p>
        </div>
        {hasGain ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <TrendingUp className="size-3" />+{delta} điểm tiềm năng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
            Tối ưu 100%
          </span>
        )}
      </div>

      {/* Visual score comparison */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Current score */}
        <div className="flex-1 rounded-2xl bg-white/55 p-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Hiện tại
          </p>
          <div className="mt-1 flex items-baseline justify-center gap-0.5">
            <span className="text-[26px] font-extrabold tabular-nums tracking-tight text-foreground/80">
              {currentScore}
            </span>
            <span className="text-[11px] text-foreground/45">/100</span>
          </div>
        </div>

        {/* Dynamic Transition indicator */}
        <div className="flex flex-col items-center justify-center">
          <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 shadow-sm">
            <Zap className="size-4" />
          </span>
          <span className="mt-0.5 text-[9px] font-medium text-emerald-600">
            Có thể đạt
          </span>
        </div>

        {/* Potential score */}
        <div
          className="flex-1 rounded-2xl p-3.5 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(209, 250, 229, 0.5))",
            border: "1.5px solid rgba(52, 211, 153, 0.45)",
            boxShadow:
              "0 8px 20px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Tiềm năng
            </p>
            <span className="text-xs">{potentialBand.emoji}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-0.5">
            <span className="text-[26px] font-extrabold tabular-nums tracking-tight text-emerald-600">
              {potentialScore}
            </span>
            <span className="text-[11px] text-emerald-600/70">/100</span>
          </div>
        </div>
      </div>

      {/* Two-stage progress bar */}
      <div className="mt-4 space-y-1.5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/5 p-0.5">
          {/* Base current score */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(currentScore, 100)}%` }}
            transition={{ ...REPORT_SPRING, delay: 0.2 }}
            className="h-full rounded-full bg-foreground/60"
          />
          {/* Recoverable score segment */}
          {hasGain && (
            <motion.div
              initial={{ width: 0, left: `${Math.min(currentScore, 100)}%` }}
              animate={{
                width: `${Math.min(delta, 100 - currentScore)}%`,
                left: `${Math.min(currentScore, 100)}%`,
              }}
              transition={{ ...REPORT_SPRING, delay: 0.35 }}
              className="absolute top-0.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
            />
          )}
        </div>
      </div>

      {/* Motivational copy */}
      <p className="mt-3 text-[12px] leading-relaxed text-foreground/75">
        {hasGain ? (
          <>
            Làn da của bạn có thể thăng hạng lên{" "}
            <span className="font-bold text-emerald-700">
              {potentialBand.label} ({potentialScore} điểm)
            </span>{" "}
            chỉ bằng việc tối ưu hóa nhịp sinh học và bảo vệ da. Khám phá ngay
            bộ mô phỏng bên dưới!
          </>
        ) : (
          <>
            Lối sống của bạn đang bổ trợ tối đa cho da ({currentScore}/100). Hãy
            tiếp tục duy trì đều đặn để giữ vững lớp màng bảo vệ tự nhiên!
          </>
        )}
      </p>
    </motion.div>
  );
}
