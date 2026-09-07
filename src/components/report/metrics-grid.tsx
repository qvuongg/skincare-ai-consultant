"use client";

import {
  ArrowRight,
  Circle,
  Droplets,
  Flame,
  Grid2x2,
  Layers,
  Palette,
  Sparkles,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type {
  AcneCounts,
  CompositeBreakdown,
} from "@/lib/scoring/engine";

import { MetricCard } from "./metric-card";
import { getMetricInsight, type ReportContext } from "./insights";

type MetricSpec = {
  key: keyof CompositeBreakdown;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const METRICS_MAP: Record<keyof CompositeBreakdown, MetricSpec> = {
  hydration: { key: "hydration", label: "Cấp ẩm", hint: "Hydration", icon: Droplets },
  sebum: { key: "sebum", label: "Cân bằng dầu", hint: "Sebum", icon: Sparkles },
  pore: { key: "pore", label: "Lỗ chân lông", hint: "Pore", icon: Circle },
  acne: { key: "acne", label: "Tình trạng mụn", hint: "Acne", icon: Zap },
  redness: { key: "redness", label: "Da nhạy cảm / đỏ", hint: "Redness", icon: Flame },
  texture: { key: "texture", label: "Bề mặt da", hint: "Texture", icon: Grid2x2 },
  pigmentation: {
    key: "pigmentation",
    label: "Sắc tố / thâm",
    hint: "Pigmentation",
    icon: Palette,
  },
  wrinkle: { key: "wrinkle", label: "Nếp nhăn", hint: "Wrinkle", icon: Waves },
  skin_tone_evenness: {
    key: "skin_tone_evenness",
    label: "Đều màu da",
    hint: "Tone evenness",
    icon: Layers,
  },
};

type MetricGroup = {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  keys: (keyof CompositeBreakdown)[];
};

const METRIC_GROUPS: MetricGroup[] = [
  {
    id: "moisture",
    title: "Cấp Ẩm & Tuyến Dầu",
    desc: "Cân bằng lượng nước và bã nhờn tự nhiên",
    emoji: "💧",
    keys: ["hydration", "sebum", "pore"],
  },
  {
    id: "barrier",
    title: "Mụn & Hàng Rào Bảo Vệ",
    desc: "Tình trạng viêm mụn, đỏ rát & kết cấu da",
    emoji: "🛡️",
    keys: ["acne", "redness", "texture"],
  },
  {
    id: "aging",
    title: "Sắc Tố & Dấu Hiệu Lão Hóa",
    desc: "Mức độ đều màu, thâm sạm & nếp nhăn",
    emoji: "⏳",
    keys: ["pigmentation", "wrinkle", "skin_tone_evenness"],
  },
];

function acneSubtitle(c: AcneCounts): string | null {
  const total = c.mild + c.moderate + c.severe;
  if (total === 0) return "Không phát hiện mụn rõ rệt";
  const parts: string[] = [];
  if (c.mild > 0) parts.push(`${c.mild} nhẹ`);
  if (c.moderate > 0) parts.push(`${c.moderate} vừa`);
  if (c.severe > 0) parts.push(`${c.severe} nặng`);
  return parts.join(" · ");
}

type Props = {
  breakdown: CompositeBreakdown;
  acne: AcneCounts;
  ctx: ReportContext;
  onNextTab?: () => void;
};

export function MetricsGrid({ breakdown, acne, ctx, onNextTab }: Props) {
  let globalCardIndex = 0;

  return (
    <section className="space-y-6">
      <header className="px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight text-foreground">
            Bản Đồ 9 Chỉ Số Sinh Lý Da
          </h2>
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/55">
            Thang 0–100
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-foreground/60 leading-relaxed">
          Đo lường chi tiết cấu trúc vi điểm trên khuôn mặt, 100 điểm là chuẩn
          làn da khỏe lý tưởng.
        </p>
      </header>

      {/* Grouped Categories */}
      <div className="space-y-5">
        {METRIC_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2.5">
            {/* Category Header */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-base">{group.emoji}</span>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight text-foreground">
                  {group.title}
                </h3>
                <p className="text-[10px] text-foreground/50">{group.desc}</p>
              </div>
            </div>

            {/* Grid for this category */}
            <div className="grid grid-cols-2 gap-2.5">
              {group.keys.map((key) => {
                const spec = METRICS_MAP[key];
                const cardIdx = globalCardIndex++;
                return (
                  <MetricCard
                    key={spec.key}
                    label={spec.label}
                    hint={spec.hint}
                    score={breakdown[spec.key]}
                    Icon={spec.icon}
                    index={cardIdx}
                    subtitle={spec.key === "acne" ? acneSubtitle(acne) : null}
                    insight={getMetricInsight(spec.key, breakdown[spec.key], ctx)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Guided Funnel Next Step CTA */}
      {onNextTab && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNextTab}
            className="flex h-13 w-full items-center justify-between px-5 rounded-2xl border border-white/70 bg-gradient-to-r from-white/90 to-white/70 hover:from-white hover:to-white/90 text-foreground shadow-sm transition-all active:scale-98"
            style={{
              boxShadow:
                "0 8px 24px rgba(31, 38, 135, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
            }}
          >
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                Bước tiếp theo
              </p>
              <p className="text-[13px] font-bold text-foreground">
                Xem Lối Sống Ảnh Hưởng Điểm Số
              </p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-full bg-black/5 text-foreground/75">
              <ArrowRight className="size-4" />
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
