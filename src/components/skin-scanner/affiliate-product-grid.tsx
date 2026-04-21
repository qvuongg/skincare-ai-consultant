"use client";

import Image from "next/image";
import { Star, ExternalLink, Tag, Beaker } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AFFILIATE_NOTICE } from "@/lib/constants";
import { t } from "@/lib/translations";
import { HeroProduct, MatchedProductResult } from "@/lib/products/matcher";
import type { ProductCategoryId } from "@/types/skin-analysis";

type Props = {
  recommendedProducts: Record<ProductCategoryId, MatchedProductResult>;
  scanId: string | null;
};

export function AffiliateProductGrid({ recommendedProducts, scanId }: Props) {
  const categories: { id: ProductCategoryId; label: string }[] = [
    { id: "cleanser", label: "Sữa rửa mặt" },
    { id: "treatment", label: "Serum & Đặc trị" },
    { id: "moisturizer", label: "Kem dưỡng ẩm" },
    { id: "sunscreen", label: "Kem chống nắng" },
  ];

  const trackClick = (product: HeroProduct) => {
    const url = scanId ? `/go/${product.id}?scan_id=${encodeURIComponent(scanId)}` : `/go/${product.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
        {AFFILIATE_NOTICE}
      </div>

      {categories.map((cat) => {
        const matches = recommendedProducts[cat.id];
        if (!matches.budget && !matches.mid && !matches.premium) return null;

        return (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
              <h3 className="text-lg font-bold uppercase tracking-tight text-primary">
                {cat.label}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["budget", "mid", "premium"] as const).map((range) => {
                const product = matches[range];
                const label = t(`scanner.${range}_label`);
                
                return (
                  <Card key={range} className={`relative flex flex-col overflow-hidden border-2 transition-all hover:shadow-md ${product ? 'border-border' : 'border-dashed opacity-60'}`}>
                    <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-primary px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                      {label}
                    </div>
                    
                    {product && (
                      <div className="relative aspect-square w-full bg-white p-4">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}

                    <CardHeader className="pb-2 pt-4">
                      {product ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <CardDescription className="font-bold text-primary text-xs uppercase tracking-wider">
                              {product.brand}
                            </CardDescription>
                            <div className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                              <Star className="size-2.5 fill-amber-500 mr-1" />
                              {product.rating}
                            </div>
                          </div>
                          <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 italic">
                            &quot;{product.tagline}&quot;
                          </p>
                        </>
                      ) : (
                        <CardTitle className="text-sm text-muted-foreground italic">
                          {t("scanner.no_matching_products")}
                        </CardTitle>
                      )}
                    </CardHeader>

                    {product && (
                      <>
                        <CardContent className="flex-grow space-y-3 pb-4">
                          <div className="flex flex-wrap gap-1">
                            {product.key_ingredients.slice(0, 3).map((ing) => (
                              <Badge key={ing} variant="secondary" className="text-[10px] px-1.5 py-0">
                                <Beaker className="mr-1 size-2" />
                                {t(`product_data.ingredients.${ing}`) !== `product_data.ingredients.${ing}` 
                                  ? t(`product_data.ingredients.${ing}`) 
                                  : ing}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.skin_type_tags.map((tag) => (
                              <span key={tag} className="text-[10px] text-muted-foreground flex items-center">
                                <Tag className="mr-1 size-2" />
                                {t(`product_data.tags.${tag}`) !== `product_data.tags.${tag}` 
                                  ? t(`product_data.tags.${tag}`) 
                                  : tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                          <Button 
                            className="w-full text-xs" 
                            size="sm"
                            onClick={() => trackClick(product)}
                          >
                            {t("scanner.check_price")}
                            <ExternalLink className="ml-2 size-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
