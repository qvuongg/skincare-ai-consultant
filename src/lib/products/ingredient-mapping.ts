import type { ProductCategoryId } from "@/types/skin-analysis";
import recommendations from "./recommendations.json";

export type ProductRecommendation = {
  id: string;
  name: string;
  brand?: string;
  affiliatePath: string;
};

type CategoryCatalog = Record<
  ProductCategoryId,
  readonly ProductRecommendation[]
>;

const catalog = recommendations as CategoryCatalog;

/**
 * Maps each suggested ingredient string to a product category.
 * Keywords are matched case-insensitively; unknown ingredients default to treatment (actives).
 */
const RULES: { category: ProductCategoryId; patterns: RegExp[] }[] = [
  {
    category: "cleanser",
    patterns: [/cleans/i, /face wash/i, /micellar/i],
  },
  {
    category: "treatment",
    patterns: [
      /salicylic/i,
      /retin/i,
      /niacinamide/i,
      /azelaic/i,
      /benzoyl peroxide/i,
      /glycolic/i,
      /vitamin\s*c/i,
      /ascorb/i,
      /acid/i,
      /peptide/i,
      /serum/i,
      /treatment/i,
    ],
  },
  {
    category: "moisturizer",
    patterns: [/ceramide/i, /hyaluronic/i, /moistur/i, /barrier/i, /emollient/i],
  },
  {
    category: "sunscreen",
    patterns: [/spf/i, /sunscreen/i, /uv/i, /mineral filter/i, /zinc/i, /titanium/i],
  },
];

export function mapIngredientToCategory(ingredient: string): ProductCategoryId {
  const s = ingredient.trim();
  for (const { category, patterns } of RULES) {
    if (patterns.some((p) => p.test(s))) {
      return category;
    }
  }
  return "treatment";
}

/**
 * Returns unique categories and product picks for the AI ingredient list.
 * One category appears once; products are the static catalog for that category.
 */
export function mapIngredientsToProductCategories(ingredients: string[]): {
  category: ProductCategoryId;
  label: string;
  products: ProductRecommendation[];
}[] {
  const categories = new Set<ProductCategoryId>();
  for (const ing of ingredients) {
    categories.add(mapIngredientToCategory(ing));
  }

  const labels: Record<ProductCategoryId, string> = {
    cleanser: "Cleansers",
    treatment: "Treatments & serums",
    moisturizer: "Moisturizers",
    sunscreen: "Sun protection",
  };

  return Array.from(categories).map((category) => ({
    category,
    label: labels[category],
    products: [...catalog[category]],
  }));
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
