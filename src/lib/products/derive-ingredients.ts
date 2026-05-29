/**
 * Maps AI scan metrics + user goals → recommended ingredient list.
 *
 * Drives the matcher's ranking signal (SPEC §8 Concerns→Ingredients table).
 * Returns a flat, de-duplicated array; the matcher does substring matching,
 * so the entries can be short ("BHA") or specific ("Salicylic Acid 2%").
 *
 * Each threshold below mirrors SPEC §6.B metric direction:
 *   - hydration / texture / skin_tone_evenness: HIGH = good
 *   - sebum: 50 = optimal (>60 = oily)
 *   - everything else: HIGH = problem
 */

import type { AiMetrics } from "@/lib/scoring/engine";

export function deriveRecommendedIngredients(
  metrics: AiMetrics,
  goals: string[] | null
): string[] {
  const set = new Set<string>();
  const goalSet = new Set(goals ?? []);

  // ── Acne: total count + severity drives BHA / anti-inflammatory ──
  const acneTotal =
    metrics.acne.mild + metrics.acne.moderate + metrics.acne.severe;
  if (
    acneTotal >= 3 ||
    metrics.acne.severe > 0 ||
    metrics.acne.moderate >= 2 ||
    goalSet.has("clear_acne") ||
    goalSet.has("acne")
  ) {
    set.add("Salicylic Acid");
    set.add("BHA");
    set.add("Niacinamide");
    set.add("Zinc");
    set.add("Centella");
  }

  // ── Sebum > 60 → oily ──
  if (metrics.sebum > 60) {
    set.add("Niacinamide");
    set.add("Salicylic Acid");
    set.add("Zinc");
  }
  // ── Sebum < 40 → dry — needs lipid replenishment ──
  if (metrics.sebum < 40) {
    set.add("Squalane");
    set.add("Ceramides");
    set.add("Shea Butter");
  }

  // ── Hydration < 60 → dehydrated ──
  if (metrics.hydration < 60) {
    set.add("Hyaluronic Acid");
    set.add("Glycerin");
    set.add("Panthenol");
    set.add("Ceramides");
  }

  // ── Pigmentation > 50 → brightening stack ──
  if (metrics.pigmentation > 50 || goalSet.has("brightening")) {
    set.add("Vitamin C");
    set.add("Niacinamide");
    set.add("Alpha Arbutin");
    set.add("Tranexamic Acid");
    set.add("Kojic Acid");
  }

  // ── Wrinkle > 50 OR sagging > 50 (35+) OR anti-aging goal ──
  if (
    metrics.wrinkle > 50 ||
    (metrics.sagging ?? 0) > 50 ||
    goalSet.has("anti_aging") ||
    goalSet.has("anti-aging")
  ) {
    set.add("Retinol");
    set.add("Peptides");
    set.add("Vitamin C");
    set.add("Collagen");
  }

  // ── Redness > 60 → barrier soothing ──
  if (metrics.redness > 60) {
    set.add("Centella");
    set.add("Panthenol");
    set.add("Allantoin");
    set.add("Madecassoside");
  }

  // ── Pore visibility > 60 → mattifying + BHA ──
  if (metrics.pore > 60) {
    set.add("Niacinamide");
    set.add("BHA");
    set.add("Salicylic Acid");
  }

  // ── Texture low (rough) → resurfacing ──
  if (metrics.texture < 60) {
    set.add("AHA");
    set.add("Lactic Acid");
    set.add("Glycolic Acid");
  }

  // ── Dark circles > 60 → vitamin K / caffeine / vitamin C ──
  if (metrics.dark_circles > 60) {
    set.add("Vitamin C");
    set.add("Caffeine");
    set.add("Peptides");
  }

  // ── Goal: hydration ──
  if (goalSet.has("hydration") || goalSet.has("moisture")) {
    set.add("Hyaluronic Acid");
    set.add("Ceramides");
    set.add("Glycerin");
  }

  // ── Sunscreen always relevant ──
  set.add("SPF");
  set.add("PA+");

  return Array.from(set);
}
