/**
 * Report payload — mirrors the JSON returned by `/api/analyze-skin` when
 * the triple-image branch fires. Single source of truth for the report UI.
 */

import type {
  AiMetrics,
  CompositeBreakdown,
  LifestyleModifier,
  ScoreBandId,
} from "@/lib/scoring/engine";

export type ScanReportScoreBand = {
  id: ScoreBandId;
  label: string;
  emoji: string;
  color: string;
  message: string;
  cta: string;
};

export type ScanReportPayload = {
  scan_report_id: string | null;
  overall_score: number;
  composite_score: number;
  score_band: ScanReportScoreBand;
  ai_metrics: AiMetrics;
  composite_breakdown: CompositeBreakdown;
  lifestyle_modifiers: LifestyleModifier[];
  modifier_total: { raw: number; applied: number };
  disclaimer: string;
};

// Spring physics shared across the whole report — SPEC §2.1.
export const REPORT_SPRING = {
  type: "spring" as const,
  stiffness: 220,
  damping: 26,
};
