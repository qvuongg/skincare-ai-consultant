import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, RotateCcw, ArrowLeft } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeCompositeScore,
  computeCompositeBreakdown,
  getScoreBand,
  capModifierTotal,
  type AiMetrics,
} from "@/lib/scoring/engine";
import { matchProducts, type HeroProduct } from "@/lib/products/matcher";
import { deriveRecommendedIngredients } from "@/lib/products/derive-ingredients";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import type { ProductCategoryId } from "@/types/skin-analysis";
import {
  getSkinTypeLabel,
  getAgeRangeLabel,
  type AgeRangeId,
  getEnvironmentLabel,
  type EnvironmentId,
  getDietLabels,
  type DietOptionId,
} from "@/lib/onboarding/labels";
import { GOAL_LABELS } from "@/components/onboarding/step-goal";
import type { ReportContext } from "@/components/report/insights";
import type { ScanReportPayload } from "@/components/report/types";
import { MeshGradient } from "@/components/onboarding/mesh-gradient";

import { ReportClientShell } from "./report-client-shell";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const admin = createAdminClient();
    const { data: report } = await admin
      .from("scan_reports")
      .select("overall_score, score_band, lead_id, leads(name)")
      .eq("id", id)
      .maybeSingle();

    if (report) {
      const scoreBand = getScoreBand(report.overall_score);
      const lead = Array.isArray(report.leads) ? report.leads[0] : report.leads;
      const userName = (lead as { name?: string })?.name || "bạn";
      const title = `Báo cáo làn da (${report.overall_score}/100) của ${userName} · Mika AI`;
      const description = `Kết quả phân tích da chuẩn khoa học: ${scoreBand.label} ${scoreBand.emoji}. Khám phá phác đồ routine chăm sóc da được AI cá nhân hóa.`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: "article",
          locale: "vi_VN",
          siteName: "Casa Mika AI",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
        },
      };
    }
  } catch (err) {
    console.error("Error generating metadata for report:", err);
  }

  return {
    title: "Báo cáo phân tích làn da · Mika AI",
    description: "Khám phá tình trạng da và phác đồ routine cá nhân hóa cùng Mika AI Consultant.",
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch scan report from Supabase via admin client (bypasses RLS safely on server)
  const admin = createAdminClient();
  const { data: report, error } = await admin
    .from("scan_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // 404 Not Found State
  if (error || !report) {
    return (
      <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <MeshGradient />
        <div
          className="relative z-10 w-full max-w-sm rounded-[28px] border border-white/60 p-8 shadow-xl"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Không tìm thấy báo cáo
          </h1>
          <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
            Đường dẫn báo cáo này không tồn tại hoặc đã bị gỡ bỏ theo yêu cầu quyền riêng tư.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/onboarding"
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/85 transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="size-4" />
              Bắt đầu soi da mới
            </Link>
            <Link
              href="/"
              className="flex h-10 items-center justify-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch associated lead for rich onboarding context
  let lead: Record<string, unknown> | null = null;
  if (report.lead_id) {
    const { data: leadData } = await admin
      .from("leads")
      .select("*")
      .eq("id", report.lead_id)
      .maybeSingle();
    lead = (leadData as Record<string, unknown>) ?? null;
  }

  const rawData =
    lead?.raw_data && typeof lead.raw_data === "object"
      ? (lead.raw_data as Record<string, unknown>)
      : {};
  const lifestyle =
    rawData?.lifestyle && typeof rawData.lifestyle === "object"
      ? (rawData.lifestyle as Record<string, unknown>)
      : {};
  const routineObj =
    report.recommended_routine && typeof report.recommended_routine === "object"
      ? (report.recommended_routine as Record<string, unknown>)
      : null;

  // 3. Resolve user display info
  const leadName = typeof lead?.name === "string" ? lead.name : null;
  const rawUserName =
    typeof rawData?.user_name === "string"
      ? rawData.user_name
      : typeof rawData?.name === "string"
        ? rawData.name
        : null;
  const userName = leadName || rawUserName || "Bạn";

  const primaryGoal = typeof lead?.primary_goal === "string" ? lead.primary_goal : null;
  const rawGoals = Array.isArray(rawData?.primary_goals) ? (rawData.primary_goals as string[]) : [];
  const goalRaw = primaryGoal || rawGoals[0] || null;
  const goalLabel = goalRaw ? (GOAL_LABELS[goalRaw] ?? goalRaw) : null;

  const ageRange = (typeof rawData?.age_range === "string" ? rawData.age_range : null) as AgeRangeId | null;
  const workEnvironment = (typeof rawData?.environment === "string" ? rawData.environment : null) as EnvironmentId | null;
  const diet = (Array.isArray(rawData?.diet) ? rawData.diet : []) as DietOptionId[];
  const skinType =
    (typeof lead?.skin_type_detected === "string" ? lead.skin_type_detected : null) ||
    (typeof rawData?.skin_type === "string" ? getSkinTypeLabel(rawData.skin_type) : null);

  const rawLocation =
    typeof lifestyle?.location === "string"
      ? lifestyle.location
      : typeof lead?.location === "string"
        ? lead.location
        : null;

  const reportCtx: ReportContext = {
    userName,
    goalLabel,
    ageId: ageRange,
    ageLabel: getAgeRangeLabel(ageRange),
    location: rawLocation,
    workEnvId: workEnvironment,
    workEnvLabel: getEnvironmentLabel(workEnvironment),
    dietIds: diet,
    dietLabels: getDietLabels(diet),
    waterLiters: typeof lifestyle?.water_liters === "number" ? lifestyle.water_liters : null,
    sleepHours: typeof lifestyle?.sleep_hours === "number" ? lifestyle.sleep_hours : null,
  };

  // 4. Resolve products & routine
  let recommendedProducts = (routineObj?.recommended_products as Record<ProductCategoryId, HeroProduct | null> | undefined) ?? null;
  const budgetVnd =
    typeof routineObj?.budget_vnd === "number"
      ? routineObj.budget_vnd
      : typeof rawData?.budget_vnd === "number"
        ? rawData.budget_vnd
        : null;

  // Fallback: If recommended_products was not saved in DB row, re-match against catalogue
  if (!recommendedProducts) {
    try {
      const { data: catalogue } = await admin
        .from("products")
        .select("*")
        .order("brand", { ascending: true });

      const recommendedIngredients = deriveRecommendedIngredients(
        report.ai_metrics,
        rawGoals.length > 0 ? rawGoals : null
      );

      recommendedProducts = matchProducts(
        catalogue ?? [],
        skinType || "",
        budgetVnd,
        recommendedIngredients
      );
    } catch (matchErr) {
      console.error("Fallback product matching error:", matchErr);
      recommendedProducts = { cleanser: null, treatment: null, moisturizer: null, sunscreen: null };
    }
  }

  // 5. Compute scores and payload
  const aiMetrics = report.ai_metrics as AiMetrics;
  const compositeScore = computeCompositeScore(aiMetrics);
  const scoreBand = getScoreBand(report.overall_score);
  const compositeBreakdown = computeCompositeBreakdown(aiMetrics);
  const modifiers = Array.isArray(report.lifestyle_modifiers) ? report.lifestyle_modifiers : [];
  const modTotals = capModifierTotal(modifiers);

  const payload: ScanReportPayload = {
    scan_report_id: report.id,
    overall_score: report.overall_score,
    composite_score: compositeScore,
    score_band: {
      id: scoreBand.id,
      label: scoreBand.label,
      emoji: scoreBand.emoji,
      color: scoreBand.color,
      message: scoreBand.message,
      cta: scoreBand.cta,
    },
    ai_metrics: aiMetrics,
    composite_breakdown: compositeBreakdown,
    lifestyle_modifiers: modifiers,
    modifier_total: {
      raw: modTotals.raw,
      applied: modTotals.capped,
    },
    recommended_products: recommendedProducts,
    budget_vnd: budgetVnd,
    disclaimer: MEDICAL_DISCLAIMER,
  };

  return (
    <ReportClientShell
      reportId={report.id}
      result={payload}
      ctx={reportCtx}
      skinType={skinType}
      createdAt={report.created_at}
    />
  );
}
