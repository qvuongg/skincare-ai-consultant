/**
 * Shared, pure onboarding labels and helpers.
 * Kept free of "use client" so both Server Components (like /report/[id]/page.tsx)
 * and Client Components can import without runtime boundary violations.
 */

// ── Age ─────────────────────────────────────────────────────────────

export type AgeRangeId =
  | "u18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_plus";

export const AGE_RANGE_LABELS: Record<AgeRangeId, string> = {
  u18: "Dưới 18",
  "18_24": "18 – 24",
  "25_34": "25 – 34",
  "35_44": "35 – 44",
  "45_54": "45 – 54",
  "55_plus": "Trên 55",
};

export function getAgeRangeLabel(id: AgeRangeId | null | undefined): string | null {
  if (!id) return null;
  return AGE_RANGE_LABELS[id] ?? null;
}

// ── Environment ─────────────────────────────────────────────────────

export type EnvironmentId = "office" | "factory" | "outdoor" | "other";

export const ENVIRONMENT_LABELS: Record<EnvironmentId, string> = {
  office: "Văn phòng máy tính",
  factory: "Nhà máy",
  outdoor: "Ngoài trời",
  other: "Khác",
};

export function getEnvironmentLabel(
  id: EnvironmentId | null | undefined
): string | null {
  if (!id) return null;
  return ENVIRONMENT_LABELS[id] ?? null;
}

// ── Diet ────────────────────────────────────────────────────────────

export type DietOptionId =
  | "sweet"
  | "spicy"
  | "fatty"
  | "stimulants"
  | "healthy";

export const DIET_LABELS: Record<DietOptionId, string> = {
  sweet: "Ăn ngọt nhiều",
  spicy: "Ăn cay nhiều",
  fatty: "Ăn đồ béo nhiều",
  stimulants: "Chất kích thích",
  healthy: "Đang ăn Healthy",
};

export function getDietLabels(ids: readonly DietOptionId[] | null | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => DIET_LABELS[id] ?? id);
}

// ── Skin Type ───────────────────────────────────────────────────────

export const SKIN_TYPE_LABELS: Record<string, string> = {
  oily: "Da dầu",
  dry: "Da khô",
  combo: "Da hỗn hợp",
  normal: "Da thường",
};

export function getSkinTypeLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return SKIN_TYPE_LABELS[id] ?? id;
}
