import { analyzeSkinImage } from "@/lib/gemini/analyze-skin";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { recordSkinScan } from "@/lib/analytics/events";
import { t } from "@/lib/translations";
import { matchProducts } from "@/lib/products/matcher";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — fits under Vercel's 4.5MB body cap with JSON overhead.

type ParsedInput = {
  buffer: Buffer;
  mimeType: string;
  onboardingContext: unknown;
};

function base64DecodedSize(b64: string): number {
  const clean = b64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  const padding = clean.match(/=+$/)?.[0].length ?? 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function tooLarge() {
  return Response.json({ error: t("api.file_too_large") }, { status: 400 });
}

function badRequest(errorKey: string) {
  return Response.json({ error: t(errorKey) }, { status: 400 });
}

async function parseJsonBody(request: Request): Promise<ParsedInput | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("api.no_image");
  }

  if (typeof body !== "object" || body === null) {
    return badRequest("api.no_image");
  }

  const b = body as Record<string, unknown>;
  const image = b.image as Record<string, unknown> | undefined;
  if (!image || typeof image.data !== "string" || typeof image.mimeType !== "string") {
    return badRequest("api.no_image");
  }

  const mimeType = image.mimeType.toLowerCase();
  if (!mimeType.startsWith("image/")) {
    return badRequest("api.invalid_type");
  }

  const rawB64 = image.data.replace(/^data:[^;]+;base64,/, "");
  if (base64DecodedSize(rawB64) > MAX_BYTES) {
    return tooLarge();
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawB64, "base64");
  } catch {
    return badRequest("api.invalid_type");
  }

  return {
    buffer,
    mimeType,
    onboardingContext: b.onboardingContext ?? null,
  };
}

async function parseFormBody(request: Request): Promise<ParsedInput | Response> {
  const formData = await request.formData();
  const file = formData.get("image");
  const onboardingContextRaw = formData.get("onboardingContext");

  let onboardingContext: unknown = null;
  if (onboardingContextRaw && typeof onboardingContextRaw === "string") {
    try {
      onboardingContext = JSON.parse(onboardingContextRaw);
    } catch (e) {
      console.error("Failed to parse onboardingContext:", e);
    }
  }

  if (!(file instanceof File)) {
    return badRequest("api.no_image");
  }
  if (!file.type.startsWith("image/")) {
    return badRequest("api.invalid_type");
  }
  if (file.size > MAX_BYTES) {
    return tooLarge();
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, mimeType: file.type, onboardingContext };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const parsed = contentType.includes("application/json")
      ? await parseJsonBody(request)
      : await parseFormBody(request);

    if (parsed instanceof Response) return parsed;

    const { buffer, mimeType, onboardingContext } = parsed;
    const analysis = await analyzeSkinImage(buffer, mimeType, onboardingContext);

    const admin = createAdminClient();
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("*")
      .order("brand", { ascending: true });

    if (productsError) {
      throw productsError;
    }

    const recommendedProducts = matchProducts(
      products ?? [],
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

    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    const isOverloaded =
      msg.includes("503") ||
      lower.includes("service unavailable") ||
      lower.includes("overloaded");
    const isFetchFailed =
      err instanceof Error &&
      (msg.includes("fetch failed") ||
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
      { status: isOverloaded ? 503 : 502 }
    );
  }
}
