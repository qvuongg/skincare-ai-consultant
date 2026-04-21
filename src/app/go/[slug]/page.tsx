import { redirect } from "next/navigation";
import { recordAffiliateEvent } from "@/lib/analytics/events";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export default async function AffiliateRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ scan_id?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const scanId = resolvedSearchParams?.scan_id ?? null;
  const admin = createAdminClient();
  const { data: product, error } = await admin
    .from("products")
    .select("id, affiliate_url, category")
    .eq("id", slug)
    .single();

  if (error) {
    console.error("Failed to load affiliate product:", error);
  }

  if (!product) {
    redirect("/");
  }

  try {
    void recordAffiliateEvent({
      event_type: "click",
      product_id: product.id,
      category: product.category,
      scan_id: scanId,
    });
  } catch (e) {
    console.error("Failed to log affiliate click:", e);
  }

  redirect(product.affiliate_url);
}
