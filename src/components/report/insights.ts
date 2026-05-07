/**
 * Personalization logic for the Skin Report.
 *
 *   ReportContext  ─►  getMetricInsight(metric, score, ctx)  ─►  per-card bubble
 *   ReportContext  ─►  buildCauseEffects(ctx, breakdown)     ─►  §8.4 sub-section
 *
 * Pure functions — no I/O, no React. Anything that needs onboarding state
 * gets it through `ReportContext`. Output is `null` when no rule fires so
 * the UI can simply skip the bubble instead of rendering filler text.
 */

import type { AgeRangeId } from "@/components/onboarding/step-age";
import type { DietOptionId } from "@/components/onboarding/step-diet";
import type { EnvironmentId } from "@/components/onboarding/step-environment";
import type { CompositeBreakdown } from "@/lib/scoring/engine";

// ════════════════════════════════════════════════════════════════════════
// Context — single bag of pre-resolved onboarding fields
// ════════════════════════════════════════════════════════════════════════
//
// We keep BOTH the raw enum ids (for logic gates: `ctx.ageId === "18_24"`)
// AND the Vietnamese labels (for direct copy interpolation). Resolving the
// labels once at the top of the report keeps every child component free of
// label-lookup duplication.

export type ReportContext = {
  userName: string;
  /** First primary goal as a Vietnamese label (e.g. "Trị mụn") — already
   *  resolved upstream via GOAL_LABELS. `null` when user skipped. */
  goalLabel: string | null;

  ageId: AgeRangeId | null;
  ageLabel: string | null;

  /** Free-text location string from onboarding. May be null. */
  location: string | null;

  workEnvId: EnvironmentId | null;
  workEnvLabel: string | null;

  dietIds: DietOptionId[];
  dietLabels: string[];

  waterLiters: number | null;
  sleepHours: number | null;
};

export type InsightTone = "praise" | "warning" | "neutral";

export type Insight = {
  text: string;
  tone: InsightTone;
};

// ════════════════════════════════════════════════════════════════════════
// Location heuristics
// ════════════════════════════════════════════════════════════════════════

/**
 * Strip Vietnamese diacritics + lowercase so substring matching works on
 * "Đà Nẵng", "da nang", "Da Nang City" alike. Cheap one-pass NFD.
 */
function normalizeVi(s: string): string {
  // ̀–ͯ is the Unicode "Combining Diacritical Marks" block —
  // NFD splits "ằ" into "a" + combining mark, then this strip leaves "a".
  // Do NOT paste literal combining marks here; they're visually invisible
  // and the resulting regex is a no-op.
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Coastal / southern Vietnamese cities with consistently high annual UV.
 * Hardcoded — a UV API lookup would be more accurate but adds a network
 * dependency and the seasonal swing isn't large enough to bother. If you
 * add a city here, also note its peer-region in `WARM_LOCATION_HINTS`
 * comment so future edits stay calibrated.
 */
const SUNNY_LOCATION_HINTS: readonly string[] = [
  "da nang",
  "hoi an",
  "hue",
  "nha trang",
  "phan thiet",
  "phan rang",
  "quy nhon",
  "phu yen",
  "binh dinh",
  "khanh hoa",
  "ninh thuan",
  "binh thuan",
  "ho chi minh",
  "tphcm",
  "tp.hcm",
  "saigon",
  "vung tau",
  "phu quoc",
  "can tho",
  "ben tre",
];

function isSunnyLocation(loc: string | null | undefined): boolean {
  if (!loc) return false;
  const n = normalizeVi(loc);
  return SUNNY_LOCATION_HINTS.some((h) => n.includes(h));
}

// ════════════════════════════════════════════════════════════════════════
// Per-metric insights — SPEC §8.3 personalization
// ════════════════════════════════════════════════════════════════════════

const MATURE_AGES: ReadonlySet<AgeRangeId> = new Set([
  "45_54",
  "55_plus",
]);

/**
 * Returns at most one comparative insight per metric, picked by the rules
 * in the spec brief. Add a rule by appending a branch — the `?? null` in
 * the caller handles "no rule fired."
 */
export function getMetricInsight(
  key: keyof CompositeBreakdown,
  score: number,
  ctx: ReportContext
): Insight | null {
  const s = Math.round(score);

  switch (key) {
    // ── Hydration: peer-compare against office/AC dwellers ──────────
    case "hydration": {
      if (ctx.workEnvId === "office" && s < 60) {
        return {
          text: "Thấp hơn mức trung bình của dân văn phòng máy lạnh.",
          tone: "warning",
        };
      }
      if (s >= 80 && ctx.workEnvId === "office") {
        return {
          text: "Vượt trội! Da bạn giữ nước rất tốt dù làm việc trong máy lạnh.",
          tone: "praise",
        };
      }
      return null;
    }

    // ── Wrinkle: age-relative aging signals ─────────────────────────
    case "wrinkle": {
      if (ctx.ageId === "18_24" && s < 70) {
        return {
          text: `Cảnh báo: dấu hiệu lão hóa sớm so với lứa tuổi ${ctx.ageLabel ?? "18 – 24"}.`,
          tone: "warning",
        };
      }
      // Mature peer praise. Gated at score ≥ 75 (NOT > 70) so the
      // smallest computed X reads as meaningful — at score 70 the user
      // would see "trẻ hơn 0 tuổi", which would feel like a bug.
      // Formula `(s − 70) / 5` keeps X bounded ~2..6.
      if (ctx.ageId !== null && MATURE_AGES.has(ctx.ageId) && s >= 75) {
        const yearsYounger = Math.max(2, Math.round((s - 70) / 5));
        return {
          text: `Tuyệt vời! Làn da trẻ hơn khoảng ${yearsYounger} tuổi so với thực tế.`,
          tone: "praise",
        };
      }
      return null;
    }

    // ── Pigmentation: high-UV location attribution ──────────────────
    case "pigmentation": {
      if (isSunnyLocation(ctx.location) && s < 65) {
        return {
          text: `Chỉ số UV tại ${ctx.location} là thủ phạm gây ra các điểm sậm màu này.`,
          tone: "warning",
        };
      }
      return null;
    }

    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════════
// Cause-and-Effect rows — SPEC §8.4 explicit habit-→-metric mapping
// ════════════════════════════════════════════════════════════════════════
//
// Distinct from §7.B lifestyle modifiers (which are "your habit cost you N
// points"): cause-effects state the habit factually and tie it to the
// observed metric value. Same data, friendlier framing.

const NEGATIVE_DIET_IDS: ReadonlySet<DietOptionId> = new Set([
  "sweet",
  "spicy",
  "fatty",
]);

export type CauseEffect = {
  text: string;
  tone: InsightTone;
};

export function buildCauseEffects(
  ctx: ReportContext,
  breakdown: CompositeBreakdown
): CauseEffect[] {
  const out: CauseEffect[] = [];

  // ── Water → Hydration ───────────────────────────────────────────
  if (ctx.waterLiters != null) {
    const liters = ctx.waterLiters;
    const hyd = Math.round(breakdown.hydration);
    const verb = liters >= 1.5 ? "giúp duy trì" : "đang kéo";
    const tone: InsightTone = liters >= 1.5 ? "praise" : "warning";
    out.push({
      text: `Thói quen uống ${liters}L nước/ngày ${verb} chỉ số độ ẩm ở mức ${hyd} điểm.`,
      tone,
    });
  }

  // ── Diet → Sebum ────────────────────────────────────────────────
  if (ctx.dietLabels.length > 0) {
    const sebum = Math.round(breakdown.sebum);
    const hasNegative = ctx.dietIds.some((d) => NEGATIVE_DIET_IDS.has(d));
    const hasHealthy = ctx.dietIds.includes("healthy");
    const tone: InsightTone =
      hasNegative && !hasHealthy
        ? "warning"
        : hasHealthy && !hasNegative
          ? "praise"
          : "neutral";
    out.push({
      text: `Chế độ ăn ${ctx.dietLabels.join(", ")} ảnh hưởng trực tiếp đến chỉ số Sebum (Dầu): ${sebum} điểm.`,
      tone,
    });
  }

  return out;
}
