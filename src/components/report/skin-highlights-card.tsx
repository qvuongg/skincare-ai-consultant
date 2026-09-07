"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Flame, Sparkles } from "lucide-react";
import type { CompositeBreakdown } from "@/lib/scoring/engine";
import { REPORT_SPRING } from "./types";

const METRIC_INFO: Record<
  keyof CompositeBreakdown,
  { label: string; emoji: string; shortAdvice: string }
> = {
  hydration: {
    label: "Cấp ẩm",
    emoji: "💧",
    shortAdvice: "Hàng rào ẩm suy yếu, cần serum Hyaluronic Acid & kem khóa ẩm",
  },
  acne: {
    label: "Mụn & Viêm",
    emoji: "⚡",
    shortAdvice: "Cần làm sạch sâu BHA/Salicylic Acid & kháng khuẩn nhẹ dịu",
  },
  sebum: {
    label: "Dầu nhờn",
    emoji: "✨",
    shortAdvice: "Tuyến bã nhờn hoạt động mạnh, cần kiềm dầu Niacinamide",
  },
  pore: {
    label: "Lỗ chân lông",
    emoji: "🔍",
    shortAdvice: "Bít tắc sợi bã nhờn, cần tẩy tế bào chết hóa học",
  },
  wrinkle: {
    label: "Nếp nhăn",
    emoji: "〰️",
    shortAdvice: "Dấu hiệu sụt giảm elastin, cần cấp ẩm & Peptides/Retinoid",
  },
  pigmentation: {
    label: "Sắc tố / Thâm",
    emoji: "🎨",
    shortAdvice: "Tia UV & melanin tích tụ, cần Vitamin C & chống nắng phổ rộng",
  },
  skin_tone_evenness: {
    label: "Đều màu da",
    emoji: "🪞",
    shortAdvice: "Tone da chưa đồng nhất, cần Tranexamic Acid dưỡng sáng",
  },
  redness: {
    label: "Nhạy cảm / Đỏ",
    emoji: "🔥",
    shortAdvice: "Mạch máu giãn & kích ứng, cần làm dịu với Centella (Rau má)",
  },
  texture: {
    label: "Bề mặt sần sùi",
    emoji: "▦",
    shortAdvice: "Sừng hóa chậm, cần dưỡng ẩm tầng biểu bì & AHA nhẹ",
  },
};

type Props = {
  breakdown: CompositeBreakdown;
  onJumpToTab?: (tab: "metrics" | "lifestyle" | "routine") => void;
};

export function SkinHighlightsCard({ breakdown, onJumpToTab }: Props) {
  // Sort entries from lowest to highest score
  const sorted = (
    Object.keys(breakdown) as (keyof CompositeBreakdown)[]
  ).map((key) => ({
    key,
    score: Math.round(breakdown[key]),
    ...METRIC_INFO[key],
  }));

  sorted.sort((a, b) => a.score - b.score);

  // Top 2 lowest scores = Urgent issues
  const topConcerns = sorted.slice(0, 2);
  // Top 1 highest score = Skin Strength
  const topStrength = sorted[sorted.length - 1];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay: 0.05 }}
      className="relative overflow-hidden rounded-[26px] p-5 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 241, 242, 0.45) 50%, rgba(255, 255, 255, 0.9) 100%)",
        backdropFilter: "blur(28px) saturate(190%)",
        WebkitBackdropFilter: "blur(28px) saturate(190%)",
        border: "1px solid rgba(255, 255, 255, 0.85)",
        boxShadow:
          "0 18px 40px rgba(225, 29, 72, 0.06), 0 4px 14px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
      }}
    >
      {/* Subtle top reflection line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
            <Flame className="size-3.5" />
          </span>
          <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-foreground/75">
            Báo Động & Điểm Sáng Làn Da
          </h2>
        </div>
        <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-foreground/50">
          Chẩn đoán AI
        </span>
      </div>

      {/* Two Columns / Cards: Concerns vs Strength */}
      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {/* Top 2 Urgent Concerns */}
        <div
          className="rounded-2xl p-3.5"
          style={{
            background:
              "linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(255, 255, 255, 0.85))",
            border: "1.5px solid rgba(244, 63, 94, 0.35)",
            boxShadow:
              "0 4px 16px rgba(244, 63, 94, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-rose-600">
              <AlertCircle className="size-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Ưu tiên cứu chữa
              </span>
            </div>
            <span className="text-[10px] font-medium text-rose-500">
              Điểm thấp nhất
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            {topConcerns.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/75 px-2.5 py-1.5 shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-foreground truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-foreground/60 truncate">
                      {item.shortAdvice}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[14px] font-extrabold text-rose-600 tabular-nums">
                  {item.score}đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 1 Skin Strength */}
        <div
          className="flex flex-col justify-between rounded-2xl p-3.5"
          style={{
            background:
              "linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(255, 255, 255, 0.85))",
            border: "1.5px solid rgba(16, 185, 129, 0.35)",
            boxShadow:
              "0 4px 16px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-emerald-700">
                <Sparkles className="size-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Điểm sáng nổi trội
                </span>
              </div>
              <span className="text-[10px] font-medium text-emerald-600">
                Chỉ số đẹp nhất
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white/75 px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{topStrength.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">
                    {topStrength.label}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Thuộc nhóm khỏe mạnh nhất của bạn
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[16px] font-extrabold text-emerald-600 tabular-nums">
                {topStrength.score}đ
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-foreground/65">
            Làn da có nền tảng rất tiềm năng! Chỉ cần tập trung điều trị 2 vùng
            ưu tiên là điểm số sẽ cải thiện vượt bậc.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
