import type { DBProduct } from "@/lib/supabase/db";
import type { ProductCategoryId, SyncStatus } from "@/types/skin-analysis";

export type HeroProduct = {
  id: string;
  name: string;
  brand: string;
  key_ingredients: string[];
  skin_type_tags: string[];
  price_vnd: number;
  category: ProductCategoryId;
  imageUrl: string;
  tagline: string;
  rating: number;
  affiliatePath: string;
  /** Primary affiliate URL — Shopee preferred, falls back to Lazada then Tiki. */
  actual_url: string;
  sync_status: SyncStatus;
  price_synced_at: string | null;
};

/** Onboarding skin-type IDs ↔ product `skin_type_tags` vocabulary. */
const SKIN_TYPE_ALIASES: Record<string, string[]> = {
  oily: ["oily", "acne-prone"],
  dry: ["dry"],
  combo: ["combination", "combo"],
  normal: ["normal"],
};

/** Pick the primary affiliate URL: Shopee > Lazada > Tiki. Empty string if none. */
function primaryUrl(product: DBProduct): string {
  return product.shopee_url ?? product.lazada_url ?? product.tiki_url ?? "";
}

export function toHeroProduct(product: DBProduct): HeroProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    key_ingredients: product.key_ingredients ?? [],
    skin_type_tags: product.skin_type_tags ?? [],
    price_vnd: product.price_vnd,
    category: product.category,
    imageUrl: product.image_url ?? "",
    tagline: product.tagline ?? "",
    rating: product.rating ?? 0,
    affiliatePath: product.id,
    actual_url: primaryUrl(product),
    sync_status: product.sync_status,
    price_synced_at: product.price_synced_at,
  };
}

/** Hard filter — product must match the user's self-reported skin type. */
function matchesSkinType(skinTypeId: string, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const lowerTags = tags.map((t) => t.toLowerCase());
  if (lowerTags.includes("all")) return true;
  const key = skinTypeId.trim().toLowerCase();
  if (!key) return true; // missing onboarding value → don't over-filter
  const aliases = SKIN_TYPE_ALIASES[key] ?? [key];
  return aliases.some((alias) => lowerTags.includes(alias));
}

/** Count how many recommended ingredients overlap with the product's. */
function ingredientScore(
  productIngredients: string[],
  recommended: string[]
): number {
  if (recommended.length === 0) return 0;
  return productIngredients.filter((ing) =>
    recommended.some(
      (rec) =>
        ing.toLowerCase().includes(rec.toLowerCase()) ||
        rec.toLowerCase().includes(ing.toLowerCase())
    )
  ).length;
}

/**
 * Match the best product per category for a given user, applying filters in
 * the user-requested priority order:
 *
 *   1. Category (hard)               — every routine step needs its own pick
 *   2. Skin type (hard)              — `skin_type_tags` must match (or "All")
 *   3. Budget (hard, if provided)    — `price_vnd ≤ budgetVnd`
 *   4. AiMetrics-derived ingredients — ranking signal (count of overlapping
 *                                      ingredients). Tie-break by rating
 *                                      desc, then price_vnd asc (cheaper
 *                                      wins among equals).
 *
 * Returns one HeroProduct per category, or `null` if no product survives the
 * three hard filters. Routine engine §9 will replace this with personalized
 * routine objects (incl. AI rationale).
 */
export function matchProducts(
  products: DBProduct[],
  skinTypeId: string,
  budgetVnd: number | null,
  recommendedIngredients: string[]
): Record<ProductCategoryId, HeroProduct | null> {
  const eligible = products
    .filter((p) => primaryUrl(p))
    .map(toHeroProduct);

  const categories: ProductCategoryId[] = [
    "cleanser",
    "treatment",
    "moisturizer",
    "sunscreen",
  ];

  const result: Partial<Record<ProductCategoryId, HeroProduct | null>> = {};

  for (const category of categories) {
    const survivors = eligible.filter(
      (p) =>
        p.category === category &&
        matchesSkinType(skinTypeId, p.skin_type_tags) &&
        (budgetVnd == null || budgetVnd <= 0 || p.price_vnd <= budgetVnd)
    );

    if (survivors.length === 0) {
      result[category] = null;
      continue;
    }

    survivors.sort((a, b) => {
      const scoreDelta =
        ingredientScore(b.key_ingredients, recommendedIngredients) -
        ingredientScore(a.key_ingredients, recommendedIngredients);
      if (scoreDelta !== 0) return scoreDelta;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.price_vnd - b.price_vnd;
    });

    result[category] = survivors[0];
  }

  return result as Record<ProductCategoryId, HeroProduct | null>;
}

export function buildAffiliateUrl(pathOrTemplate: string): string {
  const base =
    process.env.NEXT_PUBLIC_AFFILIATE_BASE?.replace(/\/$/, "") ??
    "https://example.com";
  const path = pathOrTemplate.startsWith("http")
    ? pathOrTemplate
    : `${base}${pathOrTemplate.startsWith("/") ? "" : "/"}${pathOrTemplate}`;
  return path;
}
