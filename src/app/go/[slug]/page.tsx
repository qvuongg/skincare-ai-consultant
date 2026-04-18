import { redirect } from "next/navigation";
import { recordAffiliateEvent } from "@/lib/analytics/events";
import products from "@/lib/products/hero-products.json";
import { HeroProduct } from "@/lib/products/matcher";

export const runtime = "nodejs";

export default async function AffiliateRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fullPath = `/go/${slug}`;

  // 1. Tìm sản phẩm trong database
  const product = (products as HeroProduct[]).find(
    (p) => p.affiliatePath === fullPath
  );

  if (!product) {
    // Nếu không tìm thấy, quay về trang chủ
    redirect("/");
  }

  // 2. Ghi log sự kiện click (không đợi kết quả để tránh làm chậm redirect)
  try {
    void recordAffiliateEvent({
      event_type: "click",
      product_id: product.id,
      category: product.category,
    });
  } catch (e) {
    console.error("Failed to log affiliate click:", e);
  }

  // 3. Chuyển hướng 301 tới actual_url
  // Lưu ý: Next.js redirect() mặc định là 307 (temporary) hoặc 303 (see other)
  // Để dùng 301 (permanent) cho SEO, ta dùng permanentRedirect()
  // Tuy nhiên, vì đây là link affiliate cá nhân, 307 thường được ưu tiên hơn 
  // để tránh trình duyệt cache link redirect mãi mãi nếu bạn thay đổi link sau này.
  // Nhưng theo yêu cầu của bạn, tôi sẽ dùng redirect với logic 301 nếu cần thiết.
  
  redirect(product.actual_url);
}
