export type { SkinAnalysis } from "@/lib/gemini/analyze-skin";

export type ProductCategoryId =
  | "cleanser"
  | "treatment"
  | "moisturizer"
  | "sunscreen";

export type PriceRange = "budget" | "mid" | "premium";

export type SyncStatus = "ok" | "stale" | "failed";

/** SPEC §5.2 budget thresholds — derive the coarse tier from a real VND price. */
export function priceBucket(priceVnd: number): PriceRange {
  if (priceVnd < 200_000) return "budget";
  if (priceVnd <= 500_000) return "mid";
  return "premium";
}

/** Vietnamese đồng formatter — e.g. 285000 → "285.000₫". */
export function formatVND(priceVnd: number): string {
  return priceVnd.toLocaleString("vi-VN") + "₫";
}
