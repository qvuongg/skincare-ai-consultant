import type { DBProduct } from "@/lib/supabase/db";
import type { ProductCategoryId } from "@/types/skin-analysis";

export type PriceRange = "budget" | "mid" | "premium";

export type HeroProduct = {
  id: string;
  name: string;
  brand: string;
  key_ingredients: string[];
  skin_type_tags: string[];
  price_range: PriceRange;
  category: ProductCategoryId;
  imageUrl: string;
  tagline: string;
  rating: number;
  affiliatePath: string;
  actual_url: string;
};

export type MatchedProductResult = {
  budget: HeroProduct | null;
  mid: HeroProduct | null;
  premium: HeroProduct | null;
};

export function toHeroProduct(product: DBProduct): HeroProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    key_ingredients: product.key_ingredients ?? [],
    skin_type_tags: product.skin_type_tags ?? [],
    price_range: product.price_range,
    category: product.category,
    imageUrl: product.image_url,
    tagline: product.tagline ?? "",
    rating: product.rating ?? 0,
    affiliatePath: product.id,
    actual_url: product.affiliate_url,
  };
}

/**
 * Khớp các sản phẩm từ database dựa trên phân tích của AI.
 * Ưu tiên các sản phẩm có ít nhất 1 thành phần được đề xuất, sau đó fallback theo category/price range.
 */
export function matchProducts(
  products: DBProduct[],
  skinType: string,
  recommendedIngredients: string[]
): Record<ProductCategoryId, MatchedProductResult> {
  const heroProducts = products
    .filter((product) => product.affiliate_url)
    .map(toHeroProduct);
  const result: Partial<Record<ProductCategoryId, MatchedProductResult>> = {};

  const categories: ProductCategoryId[] = [
    "cleanser",
    "treatment",
    "moisturizer",
    "sunscreen",
  ];

  for (const category of categories) {
    // 1. Lọc sản phẩm theo Category và Skin Type (hoặc "All")
    const categoryProducts = heroProducts.filter(
      (p) =>
        p.category === category &&
        (p.skin_type_tags.length === 0 ||
          p.skin_type_tags.includes("All") ||
          p.skin_type_tags.some((tag) =>
            skinType.toLowerCase().includes(tag.toLowerCase())
          ))
    );

    // 2. Tính điểm dựa trên số lượng thành phần khớp
    const scoredProducts = categoryProducts.map((p) => {
      const matchedIngredients = p.key_ingredients.filter((ing) =>
        recommendedIngredients.some((rec) =>
          ing.toLowerCase().includes(rec.toLowerCase()) || 
          rec.toLowerCase().includes(ing.toLowerCase())
        )
      );
      return {
        product: p,
        score: matchedIngredients.length,
      };
    });

    // 3. Sắp xếp theo điểm giảm dần
    scoredProducts.sort((a, b) => b.score - a.score);

    // 4. Chọn 1 sản phẩm tốt nhất cho mỗi phân khúc giá
    const picks: MatchedProductResult = {
      budget: null,
      mid: null,
      premium: null,
    };

    const ranges: PriceRange[] = ["budget", "mid", "premium"];
    for (const range of ranges) {
      const bestInRange = scoredProducts.find(
        (sp) => sp.product.price_range === range
      );
      if (bestInRange) {
        picks[range] = bestInRange.product;
        continue;
      }

      const fallbackInRange = categoryProducts.find(
        (product) => product.price_range === range
      );
      if (fallbackInRange) {
        picks[range] = fallbackInRange;
      }
    }

    result[category] = picks;
  }

  return result as Record<ProductCategoryId, MatchedProductResult>;
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
