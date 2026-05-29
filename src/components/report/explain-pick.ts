/**
 * Generates a metric-aware rationale for why a specific product was picked
 * for a routine step. Replaces the static per-category placeholder text
 * with sentences like "Sebum 72/100 → Niacinamide kiểm soát dầu".
 *
 * Inputs:
 *   - hero:       the picked product (carries `key_ingredients`)
 *   - metrics:    the user's 11 AI metrics (SPEC §6.B)
 *   - category:   which routine slot this product fills
 *
 * Pipeline:
 *   1. Look up the priority metrics for this category.
 *   2. Find the first metric that's in "bad" territory for the user.
 *   3. Find an ingredient in the product that targets that metric.
 *   4. Compose a Vietnamese sentence using the metric label + ingredient fix.
 *
 *  Falls back to a generic per-category copy if no metric/ingredient matches.
 */

import type { AiMetrics } from "@/lib/scoring/engine";
import type { ProductCategoryId } from "@/types/skin-analysis";
import type { HeroProduct } from "@/lib/products/matcher";

export type PickRationale = {
  /** Highlighted ingredient — short, no percentage. */
  ingredient: string;
  /** "Sebum 72/100 → kiểm soát dầu" style Vietnamese sentence. */
  target_issue: string;
};

type MetricKey =
  | "sebum"
  | "hydration"
  | "acne"
  | "pore"
  | "pigmentation"
  | "wrinkle"
  | "redness"
  | "texture"
  | "dark_circles";

const CATEGORY_METRICS: Record<ProductCategoryId, readonly MetricKey[]> = {
  cleanser: ["sebum", "acne", "pore"],
  treatment: ["acne", "pigmentation", "wrinkle", "pore", "redness"],
  moisturizer: ["hydration", "redness", "texture", "wrinkle"],
  sunscreen: ["pigmentation", "wrinkle"],
};

/** Canonical ingredient → metrics it primarily addresses. Lookup is substring
 *  match, so `"Salicylic Acid 2%"` in a product matches the `"Salicylic Acid"`
 *  key here. Order in `Object.keys` is preserved → put more specific keys
 *  first ("Hyaluronic Acid" before "Acid"). */
const INGREDIENT_TARGETS: Record<string, readonly MetricKey[]> = {
  "Salicylic Acid": ["acne", "pore", "texture"],
  "Hyaluronic Acid": ["hydration"],
  "Tranexamic Acid": ["pigmentation"],
  "Alpha Arbutin": ["pigmentation"],
  "Kojic Acid": ["pigmentation"],
  Niacinamide: ["sebum", "pigmentation", "pore"],
  Ceramides: ["hydration", "redness"],
  "Vitamin C": ["pigmentation", "wrinkle"],
  Retinol: ["wrinkle", "pigmentation", "texture"],
  Peptides: ["wrinkle"],
  Collagen: ["wrinkle"],
  Centella: ["redness", "acne"],
  Madecassoside: ["redness"],
  Panthenol: ["redness", "hydration"],
  Allantoin: ["redness"],
  Zinc: ["acne", "sebum"],
  Glycerin: ["hydration"],
  Squalane: ["hydration"],
  "Shea Butter": ["hydration"],
  AHA: ["texture", "pigmentation"],
  BHA: ["acne", "pore", "texture"],
  "Lactic Acid": ["texture", "pigmentation"],
  "Glycolic Acid": ["texture", "pigmentation"],
  Caffeine: ["dark_circles"],
};

const INGREDIENT_FIX_VERB: Record<string, string> = {
  Niacinamide: "kiểm soát dầu & làm sáng",
  "Salicylic Acid": "thông thoáng lỗ chân lông & trị mụn",
  BHA: "tẩy tế bào chết hoá học & trị mụn ẩn",
  AHA: "làm mịn & sáng da",
  "Hyaluronic Acid": "cấp ẩm sâu",
  Glycerin: "giữ ẩm bề mặt",
  Ceramides: "phục hồi hàng rào da",
  "Vitamin C": "làm sáng & chống oxy hoá",
  Retinol: "chống lão hoá & tái tạo",
  Peptides: "kích thích collagen",
  Collagen: "tăng độ đàn hồi",
  Centella: "làm dịu kích ứng",
  Madecassoside: "phục hồi da nhạy cảm",
  Panthenol: "làm dịu & phục hồi",
  Allantoin: "làm dịu da",
  Zinc: "giảm viêm mụn",
  "Alpha Arbutin": "làm mờ thâm",
  "Tranexamic Acid": "mờ sạm nám",
  "Kojic Acid": "làm sáng vùng thâm",
  Squalane: "dưỡng ẩm cho da khô",
  "Shea Butter": "khoá ẩm",
  "Lactic Acid": "tẩy tế bào chết nhẹ",
  "Glycolic Acid": "làm sáng & mịn da",
  Caffeine: "giảm quầng thâm",
};

const TARGET_ISSUE_FALLBACK: Record<ProductCategoryId, string> = {
  cleanser: "làm sạch sâu mà vẫn dịu nhẹ với hàng rào da",
  treatment: "xử lý mục tiêu chuyên sâu phù hợp với tình trạng da hiện tại",
  moisturizer: "cấp ẩm và phục hồi hàng rào da qua đêm",
  sunscreen: "bảo vệ da khỏi tia UV ở khí hậu nhiệt đới",
};

/** Threshold check — is this metric in "bad" territory for the user? */
function isMetricBad(metric: MetricKey, m: AiMetrics): boolean {
  switch (metric) {
    case "sebum":
      return m.sebum > 60 || m.sebum < 40;
    case "hydration":
      return m.hydration < 60;
    case "texture":
      return m.texture < 60;
    case "acne":
      return (
        m.acne.severe > 0 ||
        m.acne.moderate >= 2 ||
        m.acne.mild + m.acne.moderate + m.acne.severe >= 3
      );
    case "pore":
      return m.pore > 50;
    case "pigmentation":
      return m.pigmentation > 50;
    case "wrinkle":
      return m.wrinkle > 50;
    case "redness":
      return m.redness > 60;
    case "dark_circles":
      return m.dark_circles > 60;
  }
}

/** Vietnamese metric label with the score. */
function metricLabel(metric: MetricKey, m: AiMetrics): string {
  switch (metric) {
    case "sebum":
      return m.sebum > 60
        ? `Sebum ${m.sebum}/100 (da dầu)`
        : `Sebum ${m.sebum}/100 (da khô)`;
    case "hydration":
      return `Hydration ${m.hydration}/100 thấp`;
    case "texture":
      return `Texture ${m.texture}/100 sần`;
    case "acne": {
      const total = m.acne.mild + m.acne.moderate + m.acne.severe;
      return `${total} nốt mụn (${m.acne.severe} severe · ${m.acne.moderate} moderate)`;
    }
    case "pore":
      return `Lỗ chân lông ${m.pore}/100`;
    case "pigmentation":
      return `Pigmentation ${m.pigmentation}/100`;
    case "wrinkle":
      return `Wrinkle ${m.wrinkle}/100`;
    case "redness":
      return `Redness ${m.redness}/100`;
    case "dark_circles":
      return `Quầng thâm ${m.dark_circles}/100`;
  }
}

/** Find a canonical ingredient key from a product's free-form ingredient string. */
function canonicalIngredient(rawIngredient: string): string | null {
  const lower = rawIngredient.toLowerCase();
  for (const key of Object.keys(INGREDIENT_TARGETS)) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return null;
}

export function explainPick(
  hero: HeroProduct,
  metrics: AiMetrics,
  category: ProductCategoryId
): PickRationale {
  const priorities = CATEGORY_METRICS[category];

  for (const metric of priorities) {
    if (!isMetricBad(metric, metrics)) continue;

    for (const rawIng of hero.key_ingredients) {
      const canonical = canonicalIngredient(rawIng);
      if (!canonical) continue;
      const targets = INGREDIENT_TARGETS[canonical];
      if (!targets.includes(metric)) continue;

      const verb = INGREDIENT_FIX_VERB[canonical] ?? "phù hợp với tình trạng da";
      return {
        ingredient: rawIng,
        target_issue: `${metricLabel(metric, metrics)} → ${verb}`,
      };
    }
  }

  // Special case for sunscreen: no "bad metric → ingredient" path applies,
  // SPF is always relevant. Surface a UV-focused rationale.
  if (category === "sunscreen") {
    const spfIng =
      hero.key_ingredients.find((i) => /spf|pa\+/i.test(i)) ??
      hero.key_ingredients[0] ??
      "SPF";
    return {
      ingredient: spfIng,
      target_issue:
        metrics.pigmentation > 40
          ? `Pigmentation ${metrics.pigmentation}/100 → chặn UV để ngăn nám sâu hơn`
          : "lá chắn UV hằng ngày — bước không thể bỏ ở khí hậu nhiệt đới",
    };
  }

  return {
    ingredient: hero.key_ingredients[0] ?? "công thức cân bằng",
    target_issue: TARGET_ISSUE_FALLBACK[category],
  };
}
