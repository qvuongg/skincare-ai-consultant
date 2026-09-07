/**
 * Skin Score Engine — implements SPEC §7.
 *
 *   AI Metrics (§6.B)  ─┐
 *                       ├─►  composite (§7.A · 9 weighted metrics)
 *                       │             │
 *   Onboarding (§5)  ─►  ├─►  lifestyle modifiers (§7.B · clamp ±20)
 *                       │             │
 *                       └─►  final = clamp(0, 100, composite + capped_mod)
 *                                           │
 *                                           ▼
 *                                     band (§7.C)
 *
 * The engine is intentionally pure — no I/O, no logging — so it's trivial
 * to unit-test against the worked examples in §7.A/B.
 */

import { z } from "zod";

// ════════════════════════════════════════════════════════════════════════
// 1. AI Metrics — SPEC §6.B
// ════════════════════════════════════════════════════════════════════════
// All non-acne / non-blackhead metrics are 0–100. Direction column lives
// next to the composite formula in §7.A — do NOT pre-invert these on the
// AI side, the engine inverts where needed.

export const acneCountsSchema = z.object({
  // Severity counts feed the composite formula 100 − (severe·10 + moderate·5 + mild·2).
  // §6.B classifies acne as comedone/papule/pustule/nodule; we collapse to
  // severity for scoring (mild = comedone, moderate = papule, severe =
  // pustule/nodule). Keep the count_by_type breakdown for the report.
  mild: z.number().int().min(0),
  moderate: z.number().int().min(0),
  severe: z.number().int().min(0),
  count_by_type: z
    .object({
      comedone: z.number().int().min(0).default(0),
      papule: z.number().int().min(0).default(0),
      pustule: z.number().int().min(0).default(0),
      nodule: z.number().int().min(0).default(0),
    })
    .partial()
    .optional(),
});

export const blackheadsSchema = z.object({
  count: z.number().int().min(0),
  severity: z.number().min(0).max(100), // 0=clear → 100=many
});

export const aiMetricsSchema = z.object({
  // Composite contributors (9):
  hydration: z.number().min(0).max(100),
  sebum: z.number().min(0).max(100), // 0=very dry · 50=optimal · 100=very oily
  acne: acneCountsSchema,
  pore: z.number().min(0).max(100), // 0=minimal → 100=large
  pigmentation: z.number().min(0).max(100), // 0=clear → 100=heavy
  wrinkle: z.number().min(0).max(100), // 0=smooth → 100=many
  skin_tone_evenness: z.number().min(0).max(100), // 0=uneven → 100=even
  redness: z.number().min(0).max(100), // 0=calm → 100=red
  texture: z.number().min(0).max(100), // 0=rough → 100=smooth

  // Reported but excluded from composite per §7.A weight table:
  dark_circles: z.number().min(0).max(100), // 0=none → 100=heavy
  blackheads: blackheadsSchema,

  // Conditional (35+) — kept optional so younger users have null here.
  sagging: z.number().min(0).max(100).optional(),
});

export type AcneCounts = z.infer<typeof acneCountsSchema>;
export type AiMetrics = z.infer<typeof aiMetricsSchema>;

// ════════════════════════════════════════════════════════════════════════
// 2. Onboarding inputs — every field optional
// ════════════════════════════════════════════════════════════════════════
// Mirrors the SPEC §12.1 enum vocabulary so the API → engine path needs no
// translation once onboarding catches up. Today's onboarding only fills a
// subset; missing fields silently produce no modifier (engine doesn't fail).

export type AgeGroup =
  | "13-17"
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55+";

export type SleepBand = "<5" | "5-6" | "7-8" | "9+";
export type WaterBand = "<1" | "1-1.5" | "1.5-2" | "2+";
export type DietTag =
  | "sweet"
  | "spicy"
  | "fatty"
  | "stimulants"
  | "healthy"
  | "special";
export type ExerciseBand = "0" | "1-2" | "3-4" | "5+";
export type WorkEnvironment =
  | "office"
  | "outdoor"
  | "polluted"
  | "factory"
  | "hybrid";
export type SmokingHabit = "no" | "occasionally" | "regularly";
export type SunscreenUse = "daily" | "sometimes" | "never";

export type ScoringOnboarding = {
  age_group?: AgeGroup | null;
  sleep_band?: SleepBand | null;
  water_band?: WaterBand | null;
  diet?: DietTag[] | null;
  stress_level?: 1 | 2 | 3 | 4 | 5 | null;
  uses_sunscreen?: SunscreenUse | null;
  smokes?: SmokingHabit | null;
  exercise_per_week?: ExerciseBand | null;
  work_environment?: WorkEnvironment | null;
};

// ════════════════════════════════════════════════════════════════════════
// 3. Composite Score — SPEC §7.A
// ════════════════════════════════════════════════════════════════════════

// Weight table — sums to 100. Order mirrors the §7.A spec table for easy
// audit. `dark_circles`, `blackheads`, `sagging` are intentionally absent.
const COMPOSITE_WEIGHTS = {
  hydration: 0.15,
  acne: 0.2,
  pigmentation: 0.12,
  sebum: 0.1,
  pore: 0.08,
  wrinkle: 0.1,
  skin_tone_evenness: 0.1,
  redness: 0.08,
  texture: 0.07,
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Acne sub-score from severity counts. Per §7.A:
 *   100 − (severe×10 + moderate×5 + mild×2), floored at 0.
 */
function acneSubScore(c: AcneCounts): number {
  const penalty = c.severe * 10 + c.moderate * 5 + c.mild * 2;
  return clamp(100 - penalty, 0, 100);
}

/**
 * Sebum sub-score per §7.A:
 *   - oily ≥ 50: 50 + (50 − oily) / 2  → optimal=50 → 50, oily=100 → 25
 *   - oily <  50: oily / 2              → dry=0 → 0, balanced low=25
 * Optimal sebum is around 50 — both extremes drag the score down.
 */
function sebumSubScore(oily: number): number {
  return oily >= 50 ? 50 + (50 - oily) / 2 : oily / 2;
}

/** Per-metric contributions used by the composite + surfaced for the UI. */
export type CompositeBreakdown = {
  hydration: number;
  acne: number;
  pigmentation: number;
  sebum: number;
  pore: number;
  wrinkle: number;
  skin_tone_evenness: number;
  redness: number;
  texture: number;
};

export function computeCompositeBreakdown(m: AiMetrics): CompositeBreakdown {
  return {
    hydration: clamp(m.hydration, 0, 100),
    acne: acneSubScore(m.acne),
    pigmentation: clamp(100 - m.pigmentation, 0, 100),
    sebum: clamp(sebumSubScore(m.sebum), 0, 100),
    pore: clamp(100 - m.pore, 0, 100),
    wrinkle: clamp(100 - m.wrinkle, 0, 100),
    skin_tone_evenness: clamp(m.skin_tone_evenness, 0, 100),
    redness: clamp(100 - m.redness, 0, 100),
    texture: clamp(m.texture, 0, 100),
  };
}

/**
 * Weighted composite of the 9 metrics in §7.A. Returns a real-valued score
 * 0–100; rounding is the caller's choice (we round only for the persisted
 * `overall_score` int column).
 */
export function computeCompositeScore(m: AiMetrics): number {
  const b = computeCompositeBreakdown(m);
  const score =
    b.hydration * COMPOSITE_WEIGHTS.hydration +
    b.acne * COMPOSITE_WEIGHTS.acne +
    b.pigmentation * COMPOSITE_WEIGHTS.pigmentation +
    b.sebum * COMPOSITE_WEIGHTS.sebum +
    b.pore * COMPOSITE_WEIGHTS.pore +
    b.wrinkle * COMPOSITE_WEIGHTS.wrinkle +
    b.skin_tone_evenness * COMPOSITE_WEIGHTS.skin_tone_evenness +
    b.redness * COMPOSITE_WEIGHTS.redness +
    b.texture * COMPOSITE_WEIGHTS.texture;
  return clamp(score, 0, 100);
}

// ════════════════════════════════════════════════════════════════════════
// 4. Lifestyle Modifiers — SPEC §7.B (cap ±20)
// ════════════════════════════════════════════════════════════════════════
// Each rule fires independently and contributes a signed integer; the sum
// is clamped to ±20 before being added to the composite. The `metric_affected`
// field is xAI metadata only — it does NOT gate which sub-scores get the
// modifier (the modifier applies to the overall composite, once).

export type LifestyleModifier = {
  factor: string;
  value: number; // signed contribution before cap
  metric_affected: string; // for xAI breakdown — UI only
  message: string; // user-facing Vietnamese explanation
  is_red_flag?: boolean;
};

const AGE_OVER_25: ReadonlySet<AgeGroup> = new Set([
  "25-34",
  "35-44",
  "45-54",
  "55+",
]);

const NEGATIVE_DIET: ReadonlySet<DietTag> = new Set([
  "sweet",
  "spicy",
  "fatty",
]);

export function computeLifestyleModifiers(
  o: ScoringOnboarding
): LifestyleModifier[] {
  const out: LifestyleModifier[] = [];

  // ── Sleep ───────────────────────────────────────────────────────────
  if (o.sleep_band === "<5" || o.sleep_band === "5-6") {
    out.push({
      factor: "sleep",
      value: -5,
      metric_affected: "Acne, Hydration",
      message:
        "Ngủ < 6h/ngày → cortisol cao, kích thích tuyến bã nhờn và làm da kém phục hồi.",
    });
  } else if (o.sleep_band === "7-8") {
    out.push({
      factor: "sleep",
      value: 3,
      metric_affected: "Overall",
      message: "Ngủ 7–8h là khung tối ưu cho da phục hồi và tái tạo.",
    });
  }

  // ── Water intake ────────────────────────────────────────────────────
  if (o.water_band === "<1" || o.water_band === "1-1.5") {
    out.push({
      factor: "water",
      value: -5,
      metric_affected: "Hydration",
      message:
        "Uống < 1.5L nước/ngày làm tăng TEWL — da dễ khô và mất nước qua biểu bì.",
    });
  } else if (o.water_band === "2+") {
    out.push({
      factor: "water",
      value: 3,
      metric_affected: "Hydration",
      message: "Uống 2L+ nước/ngày giúp củng cố hàng rào ẩm và độ đàn hồi tự nhiên.",
    });
  }

  // ── Diet ────────────────────────────────────────────────────────────
  if (o.diet?.length) {
    const hasNegative = o.diet.some((d) => NEGATIVE_DIET.has(d));
    const hasHealthy = o.diet.includes("healthy");
    if (hasNegative) {
      out.push({
        factor: "diet",
        value: -5,
        metric_affected: "Acne, Sebum",
        message:
          "Đồ ngọt/cay/béo nhiều → tăng insulin và viêm, đẩy bã nhờn và mụn lên cao.",
      });
    }
    if (hasHealthy) {
      out.push({
        factor: "diet",
        value: 5,
        metric_affected: "Overall",
        message:
          "Chế độ ăn healthy giúp giảm viêm và hỗ trợ da phục hồi tốt hơn.",
      });
    }
  }

  // ── Stress ──────────────────────────────────────────────────────────
  if (o.stress_level === 4 || o.stress_level === 5) {
    out.push({
      factor: "stress",
      value: -5,
      metric_affected: "Acne, Redness, Hydration",
      message:
        "Stress cao kéo dài làm rối loạn hàng rào bảo vệ da và đẩy mụn lên.",
    });
  } else if (o.stress_level === 1 || o.stress_level === 2) {
    out.push({
      factor: "stress",
      value: 3,
      metric_affected: "Overall",
      message: "Mức stress thấp giúp cortisol ổn định, da đỡ kích ứng.",
    });
  }

  // ── Sunscreen + age > 25 → −8 + RED FLAG (§7.B) ─────────────────────
  // The age gate matters: skipping SPF under 25 still hurts long-term but
  // SPEC explicitly only flags it as a deduction once age_group ≥ 25-34.
  if (
    o.uses_sunscreen === "never" &&
    o.age_group != null &&
    AGE_OVER_25.has(o.age_group)
  ) {
    out.push({
      factor: "sunscreen",
      value: -8,
      metric_affected: "Pigmentation, Wrinkle",
      message:
        "Không dùng kem chống nắng dù đã trên 25 tuổi → photoaging tăng tốc rõ rệt.",
      is_red_flag: true,
    });
  }

  // ── Smoking ─────────────────────────────────────────────────────────
  if (o.smokes === "regularly") {
    out.push({
      factor: "smoking",
      value: -8,
      metric_affected: "Wrinkle, Texture, Tone",
      message:
        "Hút thuốc thường xuyên phá vỡ collagen và làm da xỉn, sạm nhanh hơn.",
    });
  }

  // ── Exercise ────────────────────────────────────────────────────────
  if (o.exercise_per_week === "3-4" || o.exercise_per_week === "5+") {
    out.push({
      factor: "exercise",
      value: 3,
      metric_affected: "Overall",
      message:
        "Tập thể dục 3+ buổi/tuần → tuần hoàn tốt, da nhận đủ oxy và dưỡng chất.",
    });
  }

  // ── Environment ─────────────────────────────────────────────────────
  if (o.work_environment === "outdoor" || o.work_environment === "polluted") {
    out.push({
      factor: "environment",
      value: -5,
      metric_affected: "Pigmentation, Redness",
      message:
        "Làm việc ngoài trời / môi trường ô nhiễm → stress oxy hóa, dễ thâm và đỏ.",
    });
  }

  return out;
}

/**
 * Sum the per-rule contributions and cap to ±20 per §7.B. Returned as both
 * the raw uncapped sum (for the report's "potential score" projection) and
 * the capped value (the only one applied to the composite).
 */
export function capModifierTotal(mods: LifestyleModifier[]): {
  raw: number;
  capped: number;
} {
  const raw = mods.reduce((acc, m) => acc + m.value, 0);
  return { raw, capped: clamp(raw, -20, 20) };
}

export type PotentialScoreResult = {
  potentialScore: number;
  delta: number;
  potentialBand: ScoreBand;
  negativeModifiers: LifestyleModifier[];
};

/**
 * Compute motivational Potential Score (SPEC §8.4.5).
 * Simulates the skin score if all negative lifestyle factors are corrected
 * into optimal habits.
 */
export function computePotentialScore(
  compositeScore: number,
  currentModifiers: LifestyleModifier[]
): PotentialScoreResult {
  const negativeMods = currentModifiers.filter((m) => m.value < 0);
  const positiveOnlySum = currentModifiers
    .filter((m) => m.value > 0)
    .reduce((acc, m) => acc + m.value, 0);

  // Bonus for turning negative habits into positive/healthy habits
  const additionalPotential = negativeMods.length * 3;
  const potentialCappedMod = clamp(positiveOnlySum + additionalPotential, -20, 20);
  const potentialScore = Math.round(clamp(compositeScore + potentialCappedMod, 0, 100));

  const currentCapped = capModifierTotal(currentModifiers).capped;
  const currentFinal = Math.round(clamp(compositeScore + currentCapped, 0, 100));
  const delta = Math.max(0, potentialScore - currentFinal);

  return {
    potentialScore,
    delta,
    potentialBand: getScoreBand(potentialScore),
    negativeModifiers: negativeMods,
  };
}

// ════════════════════════════════════════════════════════════════════════
// 5. Score Band — SPEC §7.C
// ════════════════════════════════════════════════════════════════════════

export type ScoreBandId =
  | "critical"
  | "poor"
  | "fair"
  | "good"
  | "excellent";

export type ScoreBand = {
  id: ScoreBandId;
  range: [number, number];
  label: string; // VN copy
  emoji: string;
  color: string; // hex from §2.3 / §7.C
  message: string;
  cta: string;
};

const BANDS: readonly ScoreBand[] = [
  {
    id: "critical",
    range: [0, 39],
    label: "Cần cải thiện gấp",
    emoji: "🔴",
    color: "#E74C3C",
    message:
      "Da của bạn đang cần được chăm sóc đặc biệt. Đừng lo — chúng tôi có plan cho bạn.",
    cta: "Xem Routine ngay",
  },
  {
    id: "poor",
    range: [40, 59],
    label: "Cần cải thiện",
    emoji: "🟠",
    color: "#E67E22",
    message:
      "Da bạn đang ở mức trung bình. Một số thói quen nhỏ có thể tạo ra sự khác biệt lớn.",
    cta: "Cải thiện cùng SkincareAI",
  },
  {
    id: "fair",
    range: [60, 74],
    label: "Khá ổn",
    emoji: "🟡",
    color: "#F1C40F",
    message:
      "Da bạn đang khá tốt! Hãy cùng tối ưu thêm để đạt kết quả tốt nhất.",
    cta: "Xem tips cải thiện",
  },
  {
    id: "good",
    range: [75, 89],
    label: "Tốt",
    emoji: "🟢",
    color: "#2ECC71",
    message:
      "Da bạn đang trong tình trạng tốt! Duy trì routine này và bạn sẽ thấy kết quả rõ rệt.",
    cta: "Xem routine duy trì",
  },
  {
    id: "excellent",
    range: [90, 100],
    label: "Xuất sắc",
    emoji: "✨",
    color: "#3498DB",
    message:
      "Da bạn đang ở đỉnh cao! Chỉ cần duy trì và bảo vệ làn da tuyệt vời này.",
    cta: "Chia sẻ kết quả",
  },
];

export function getScoreBand(score: number): ScoreBand {
  const s = clamp(score, 0, 100);
  // Bands are non-overlapping and cover [0, 100]; first inclusive match wins.
  for (const b of BANDS) {
    if (s >= b.range[0] && s <= b.range[1]) return b;
  }
  // Defensive: a clamped 0–100 always matches above.
  return BANDS[BANDS.length - 1];
}

// ════════════════════════════════════════════════════════════════════════
// 6. Final Score — orchestrator
// ════════════════════════════════════════════════════════════════════════

export type FinalScoreResult = {
  composite_score: number; // pre-modifier, 0–100
  composite_breakdown: CompositeBreakdown;
  lifestyle_modifiers: LifestyleModifier[];
  modifier_total_raw: number; // uncapped sum (for projection)
  modifier_total_applied: number; // ±20 clamped
  final_score: number; // post-modifier, clamped 0–100, rounded int
  band: ScoreBand;
};

/**
 * One call to score everything per SPEC §7. Caller passes the validated
 * AI metrics + onboarding payload; engine returns the full breakdown ready
 * to persist as `scan_reports.{ai_metrics, lifestyle_modifiers, overall_score, score_band}`
 * and to render the §8 report.
 */
export function computeFinalScore(
  metrics: AiMetrics,
  onboarding: ScoringOnboarding
): FinalScoreResult {
  const breakdown = computeCompositeBreakdown(metrics);
  const composite = computeCompositeScore(metrics);
  const mods = computeLifestyleModifiers(onboarding);
  const { raw, capped } = capModifierTotal(mods);
  const final = Math.round(clamp(composite + capped, 0, 100));
  return {
    composite_score: composite,
    composite_breakdown: breakdown,
    lifestyle_modifiers: mods,
    modifier_total_raw: raw,
    modifier_total_applied: capped,
    final_score: final,
    band: getScoreBand(final),
  };
}
