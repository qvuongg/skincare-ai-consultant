"use client";

import {
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

/**
 * SPEC §8.3 — chi tiết 9 chỉ số sinh lý da.
 *
 * Bound to `composite_breakdown` (already direction-corrected, 100 = good)
 * — NOT to raw `ai_metrics`, which would put pigmentation 80 ("very heavy")
 * on a high green bar. The acne sub-score is derived from severity counts
 * by the engine, but we still surface the raw counts under the card so the
 * user can see "23 mụn nhẹ · 4 vừa".
 */
type MetricSpec = {
  key: keyof CompositeBreakdown;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const METRICS: readonly MetricSpec[] = [
  { key: "hydration", label: "Cấp ẩm", hint: "Hydration", icon: Droplets },
  { key: "acne", label: "Tình trạng mụn", hint: "Acne", icon: Zap },
  { key: "sebum", label: "Cân bằng dầu", hint: "Sebum", icon: Sparkles },
  { key: "pore", label: "Lỗ chân lông", hint: "Pore", icon: Circle },
  { key: "wrinkle", label: "Nếp nhăn", hint: "Wrinkle", icon: Waves },
  {
    key: "pigmentation",
    label: "Sắc tố / thâm",
    hint: "Pigmentation",
    icon: Palette,
  },
  {
    key: "skin_tone_evenness",
    label: "Đều màu da",
    hint: "Tone evenness",
    icon: Layers,
  },
  { key: "redness", label: "Da nhạy cảm / đỏ", hint: "Redness", icon: Flame },
  { key: "texture", label: "Bề mặt da", hint: "Texture", icon: Grid2x2 },
];

function acneSubtitle(c: AcneCounts): string | null {
  const total = c.mild + c.moderate + c.severe;
  if (total === 0) return "Không phát hiện mụn rõ rệt";
  // Compact, scannable: only mention the bins that have counts.
  const parts: string[] = [];
  if (c.mild > 0) parts.push(`${c.mild} nhẹ`);
  if (c.moderate > 0) parts.push(`${c.moderate} vừa`);
  if (c.severe > 0) parts.push(`${c.severe} nặng`);
  return parts.join(" · ");
}

type Props = {
  breakdown: CompositeBreakdown;
  acne: AcneCounts;
};

export function MetricsGrid({ breakdown, acne }: Props) {
  return (
    <section>
      <header className="mb-3 px-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
          Chi tiết từng chỉ số
        </h2>
        <p className="text-[12px] text-foreground/55">
          9 chỉ số AI đo trên 3 ảnh, mỗi điểm 0–100 (100 = tốt nhất).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m, i) => (
          <MetricCard
            key={m.key}
            label={m.label}
            hint={m.hint}
            score={breakdown[m.key]}
            Icon={m.icon}
            index={i}
            subtitle={m.key === "acne" ? acneSubtitle(acne) : null}
          />
        ))}
      </div>
    </section>
  );
}
