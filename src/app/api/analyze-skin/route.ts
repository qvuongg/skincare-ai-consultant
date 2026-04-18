import { analyzeSkinImage } from "@/lib/gemini/analyze-skin";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { recordSkinScan } from "@/lib/analytics/events";
import { t } from "@/lib/translations";
import { matchProducts } from "@/lib/products/matcher";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return Response.json(
        { error: t("api.no_image") },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return Response.json(
        { error: t("api.invalid_type") },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: t("api.file_too_large") },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzeSkinImage(buffer, file.type);

    const recommendedProducts = matchProducts(
      analysis.skin_type,
      analysis.ingredients
    );

    let scanId: string | null = null;
    try {
      scanId = await recordSkinScan(analysis.concerns);
    } catch (e) {
      console.error("recordSkinScan failed:", e);
    }

    return Response.json({
      analysis,
      recommendedProducts,
      disclaimer: MEDICAL_DISCLAIMER,
      scanId,
    });
  } catch (err) {
    const cause =
      err instanceof Error && "cause" in err && err.cause
        ? String(err.cause)
        : "";
    console.error("analyze-skin error:", err, cause || undefined);
    const isFetchFailed =
      err instanceof Error &&
      (err.message.includes("fetch failed") ||
        err.name === "TypeError" ||
        cause.includes("ECONNREFUSED") ||
        cause.includes("ETIMEDOUT") ||
        cause.includes("ENOTFOUND"));
    return Response.json(
      {
        error: isFetchFailed
          ? t("api.network_error")
          : t("api.generic_error"),
      },
      { status: 502 }
    );
  }
}
