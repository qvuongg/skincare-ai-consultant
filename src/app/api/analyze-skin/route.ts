import { analyzeSkinImage } from "@/lib/gemini/analyze-skin";
import {
  analyzeSkinMetrics,
  type AnalyzeMetricsContext,
  type AnalyzeMetricsImage,
} from "@/lib/gemini/analyze-skin-metrics";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { recordSkinScan } from "@/lib/analytics/events";
import { t } from "@/lib/translations";
import { matchProducts } from "@/lib/products/matcher";
import { deriveRecommendedIngredients } from "@/lib/products/derive-ingredients";
import {
  computeFinalScore,
  type AgeGroup,
  type DietTag,
  type ExerciseBand,
  type ScoringOnboarding,
  type SleepBand,
  type SmokingHabit,
  type SunscreenUse,
  type WaterBand,
  type WorkEnvironment,
} from "@/lib/scoring/engine";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // 4MB per image — fits Vercel's 4.5MB body cap.
const MAX_IMAGES = 3;

// ════════════════════════════════════════════════════════════════════════
// Shared helpers
// ════════════════════════════════════════════════════════════════════════

type LegacyParsedInput = {
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

// ════════════════════════════════════════════════════════════════════════
// Triple-image branch — SPEC §6.B + §7
// ════════════════════════════════════════════════════════════════════════

type TripleParsed = {
  images: AnalyzeMetricsImage[];
  onboarding: unknown;
  leadId: string | null;
};

function isTripleShape(b: Record<string, unknown>): boolean {
  return Array.isArray(b.images) && b.images.length > 0;
}

/**
 * Parse + validate the triple-image payload. Each image must be a
 * `{ mimeType, data }` object with a base64 string under MAX_BYTES.
 */
function parseTripleBody(b: Record<string, unknown>): TripleParsed | Response {
  const rawImages = b.images;
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return badRequest("api.no_image");
  }
  if (rawImages.length > MAX_IMAGES) {
    return badRequest("api.no_image");
  }

  const parsedImages: AnalyzeMetricsImage[] = [];
  for (const raw of rawImages) {
    if (typeof raw !== "object" || raw === null) {
      return badRequest("api.no_image");
    }
    const img = raw as Record<string, unknown>;
    if (typeof img.mimeType !== "string" || typeof img.data !== "string") {
      return badRequest("api.no_image");
    }
    const mimeType = img.mimeType.toLowerCase();
    if (!mimeType.startsWith("image/")) {
      return badRequest("api.invalid_type");
    }
    const data = img.data.replace(/^data:[^;]+;base64,/, "");
    if (base64DecodedSize(data) > MAX_BYTES) {
      return tooLarge();
    }
    parsedImages.push({ mimeType, data });
  }

  const leadId = typeof b.lead_id === "string" ? b.lead_id : null;

  return {
    images: parsedImages,
    onboarding: b.onboarding ?? null,
    leadId,
  };
}

// ── Onboarding mapping ────────────────────────────────────────────────
// Maps the flexible client-side onboarding payload to the strict SPEC
// vocabulary the scoring engine expects. The current onboarding form only
// captures a subset of these fields — anything missing yields no modifier.

const AGE_RANGE_MAP: Record<string, AgeGroup> = {
  // Current FormData IDs (StepAge component)
  u18: "13-17",
  "18_24": "18-24",
  "25_34": "25-34",
  "35_44": "35-44",
  "45_54": "45-54",
  "55_plus": "55+",
  // Already-canonical SPEC values pass through.
  "13-17": "13-17",
  "18-24": "18-24",
  "25-34": "25-34",
  "35-44": "35-44",
  "45-54": "45-54",
  "55+": "55+",
};

const ENV_MAP: Record<string, WorkEnvironment> = {
  office: "office",
  outdoor: "outdoor",
  polluted: "polluted",
  factory: "factory",
  hybrid: "hybrid",
  // `other` from the current StepEnvironment → no clean mapping; treat as
  // hybrid (mixed) to avoid spuriously firing the outdoor penalty.
  other: "hybrid",
};

const DIET_VALUES = new Set<DietTag>([
  "sweet",
  "spicy",
  "fatty",
  "stimulants",
  "healthy",
  "special",
]);

const SMOKING_VALUES = new Set<SmokingHabit>([
  "no",
  "occasionally",
  "regularly",
]);

const SUNSCREEN_VALUES = new Set<SunscreenUse>([
  "daily",
  "sometimes",
  "never",
]);

function sleepBandFromHours(h: unknown): SleepBand | null {
  if (typeof h !== "number" || !Number.isFinite(h)) return null;
  if (h < 5) return "<5";
  if (h < 7) return "5-6";
  if (h < 9) return "7-8";
  return "9+";
}

function waterBandFromLiters(l: unknown): WaterBand | null {
  if (typeof l !== "number" || !Number.isFinite(l)) return null;
  if (l < 1) return "<1";
  if (l < 1.5) return "1-1.5";
  if (l < 2) return "1.5-2";
  return "2+";
}

function exerciseBandFromSessions(n: unknown): ExerciseBand | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n <= 0) return "0";
  if (n <= 2) return "1-2";
  if (n <= 4) return "3-4";
  return "5+";
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Best-effort: accept either the canonical SPEC §12.1 shape or the current
 * client FormData shape (with `lifestyle` nested). Field-level mismatches
 * downgrade to `null` rather than throwing — the engine handles `null`.
 */
function buildScoringOnboarding(raw: unknown): ScoringOnboarding {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;

  const lifestyle = (r.lifestyle as Record<string, unknown>) ?? {};
  const habits = (r.habits as Record<string, unknown>) ?? {};

  const ageRaw =
    asString(r.age_group) ??
    asString(r.age_range) ??
    asString(habits.age_range);
  const age_group = ageRaw ? (AGE_RANGE_MAP[ageRaw] ?? null) : null;

  // sleep / water / exercise: check both the canonical SPEC bands AND the
  // legacy FormData numeric shapes (lifestyle.sleep_hours, etc.).
  const sleep_band_str = asString(r.sleep_hours)?.replace(/\s+/g, "");
  const sleep_band =
    (sleep_band_str as SleepBand | null) ??
    sleepBandFromHours(r.sleep_hours ?? lifestyle.sleep_hours ?? habits.sleep_hours);
  const water_band_str = asString(r.water_intake_l)?.replace(/\s+/g, "");
  const water_band =
    (water_band_str as WaterBand | null) ??
    waterBandFromLiters(r.water_liters ?? lifestyle.water_liters ?? habits.water_liters);
  const exercise_per_week =
    (asString(r.exercise_per_week) as ExerciseBand | null) ??
    exerciseBandFromSessions(r.exercise_sessions ?? lifestyle.exercise_sessions ?? habits.exercise_sessions);

  const dietRaw = Array.isArray(r.diet)
    ? r.diet
    : Array.isArray(habits.diet)
      ? habits.diet
      : [];
  const diet = dietRaw
    .filter((d): d is string => typeof d === "string")
    .filter((d): d is DietTag => DIET_VALUES.has(d as DietTag));

  const stressRaw = r.stress_level ?? habits.stress_level;
  const stress_level =
    typeof stressRaw === "number" &&
    stressRaw >= 1 &&
    stressRaw <= 5 &&
    Number.isInteger(stressRaw)
      ? (stressRaw as 1 | 2 | 3 | 4 | 5)
      : null;

  const sunscreenRaw =
    asString(r.uses_sunscreen) ??
    asString(lifestyle.uses_sunscreen) ??
    asString(habits.uses_sunscreen);
  const uses_sunscreen =
    sunscreenRaw && SUNSCREEN_VALUES.has(sunscreenRaw as SunscreenUse)
      ? (sunscreenRaw as SunscreenUse)
      : null;

  const smokesRaw = asString(r.smokes) ?? asString(habits.smokes);
  const smokes =
    smokesRaw && SMOKING_VALUES.has(smokesRaw as SmokingHabit)
      ? (smokesRaw as SmokingHabit)
      : null;

  const envRaw =
    asString(r.work_environment) ??
    asString(r.environment) ??
    asString(habits.environment);
  const work_environment = envRaw ? (ENV_MAP[envRaw] ?? null) : null;

  return {
    age_group,
    sleep_band,
    water_band,
    diet: diet.length ? diet : null,
    stress_level,
    uses_sunscreen,
    smokes,
    exercise_per_week,
    work_environment,
  };
}

function buildMetricsContext(
  onboardingRaw: unknown
): AnalyzeMetricsContext | null {
  if (typeof onboardingRaw !== "object" || onboardingRaw === null) return null;
  const r = onboardingRaw as Record<string, unknown>;
  const ageRaw = asString(r.age_group) ?? asString(r.age_range);
  const age_group = ageRaw ? (AGE_RANGE_MAP[ageRaw] ?? null) : null;
  const gender = asString(r.gender);
  const goalsRaw = Array.isArray(r.primary_goals)
    ? r.primary_goals
    : Array.isArray(r.goals)
      ? r.goals
      : [];
  const goals = goalsRaw.filter((g): g is string => typeof g === "string");
  const skin_type_self_reported =
    asString(r.skin_type) ?? asString(r.skin_type_self_reported);
  const location =
    asString(r.location) ??
    asString((r.lifestyle as Record<string, unknown>)?.location);

  return {
    age_group,
    gender,
    goals: goals.length ? goals : null,
    skin_type_self_reported,
    location,
    extra_notes: null,
  };
}

async function handleTripleScan(parsed: TripleParsed): Promise<Response> {
  const ctx = buildMetricsContext(parsed.onboarding);
  const metrics = await analyzeSkinMetrics(parsed.images, ctx);

  const scoringInput = buildScoringOnboarding(parsed.onboarding);
  const score = computeFinalScore(metrics, scoringInput);

  // Product picks for the routine card. Filters applied in priority order:
  //   skin_type (hard) → budget (hard) → AiMetrics-derived ingredients (rank).
  const admin = createAdminClient();
  const { data: catalogue, error: catalogueError } = await admin
    .from("products")
    .select("*")
    .order("brand", { ascending: true });
  if (catalogueError) {
    console.error("Failed to load products for routine:", catalogueError);
  }

  const habits =
    typeof parsed.onboarding === "object" && parsed.onboarding !== null
      ? ((parsed.onboarding as Record<string, unknown>).habits as
          | Record<string, unknown>
          | undefined)
      : undefined;
  const rawBudget = habits?.budget_vnd;
  const budgetVnd =
    typeof rawBudget === "number" && Number.isFinite(rawBudget) && rawBudget > 0
      ? rawBudget
      : null;

  const recommendedIngredients = deriveRecommendedIngredients(
    metrics,
    ctx?.goals ?? null
  );
  const recommendedProducts = matchProducts(
    catalogue ?? [],
    ctx?.skin_type_self_reported ?? "",
    budgetVnd,
    recommendedIngredients
  );

  // Persist the report. Failure here should NOT block the user's response —
  // we still return the scored payload so the UI can render. Mirrors the
  // existing fire-and-forget posture for analytics.
  let scanReportId: string | null = null;
  try {
    const { data, error } = await admin
      .from("scan_reports")
      .insert([
        {
          lead_id: parsed.leadId,
          ai_metrics: metrics,
          lifestyle_modifiers: score.lifestyle_modifiers,
          overall_score: score.final_score,
          score_band: score.band.id,
          recommended_routine: {
            recommended_products: recommendedProducts,
            budget_vnd: budgetVnd,
            onboarding_context: ctx,
          },
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error("scan_reports insert failed:", error);
    } else {
      scanReportId = data?.id ?? null;
    }
  } catch (e) {
    console.error("scan_reports insert threw:", e);
  }

  return Response.json({
    scan_report_id: scanReportId,
    overall_score: score.final_score,
    composite_score: score.composite_score,
    score_band: {
      id: score.band.id,
      label: score.band.label,
      emoji: score.band.emoji,
      color: score.band.color,
      message: score.band.message,
      cta: score.band.cta,
    },
    ai_metrics: metrics,
    composite_breakdown: score.composite_breakdown,
    lifestyle_modifiers: score.lifestyle_modifiers,
    modifier_total: {
      raw: score.modifier_total_raw,
      applied: score.modifier_total_applied,
    },
    recommended_products: recommendedProducts,
    budget_vnd: budgetVnd,
    disclaimer: MEDICAL_DISCLAIMER,
  });
}

// ════════════════════════════════════════════════════════════════════════
// Legacy single-image branch — preserves StepReview's contract
// ════════════════════════════════════════════════════════════════════════

async function parseLegacyJsonBody(
  b: Record<string, unknown>
): Promise<LegacyParsedInput | Response> {
  const image = b.image as Record<string, unknown> | undefined;
  if (
    !image ||
    typeof image.data !== "string" ||
    typeof image.mimeType !== "string"
  ) {
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

async function parseFormBody(
  request: Request
): Promise<LegacyParsedInput | Response> {
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

async function handleLegacyScan(parsed: LegacyParsedInput): Promise<Response> {
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

  // Legacy single-image branch has no budget context — pass null to skip
  // the budget filter and just rank by ingredient overlap.
  const recommendedProducts = matchProducts(
    products ?? [],
    analysis.skin_type,
    null,
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
}

// ════════════════════════════════════════════════════════════════════════
// POST handler
// ════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
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

      // Triple-image branch wins when `images` is present — the legacy
      // path uses `image` (singular).
      if (isTripleShape(b)) {
        const parsed = parseTripleBody(b);
        if (parsed instanceof Response) return parsed;
        return await handleTripleScan(parsed);
      }

      const parsed = await parseLegacyJsonBody(b);
      if (parsed instanceof Response) return parsed;
      return await handleLegacyScan(parsed);
    }

    // multipart / form-data continues to work with the legacy single-image flow.
    const parsed = await parseFormBody(request);
    if (parsed instanceof Response) return parsed;
    return await handleLegacyScan(parsed);
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
