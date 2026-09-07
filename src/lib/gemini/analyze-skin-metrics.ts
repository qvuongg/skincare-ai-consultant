/**
 * Gemini multi-image analyzer that returns the 11 physiological metrics
 * defined in SPEC §6.B. Output is consumed by `src/lib/scoring/engine.ts`
 * — schema mirrors `AiMetrics` exactly.
 *
 * Design notes:
 *   - 3 images (front / left-45 / right-45) are sent in a single call so
 *     Gemini has the full 9-zone coverage required by §6.B.
 *   - We reuse the retry / model-fallback helpers from analyze-skin.ts
 *     style (kept inline here to avoid breaking that file's narrow API).
 *   - Sebum / acne directions are spelled out in the prompt because they
 *     are NOT a simple 0–100 quality scale — getting them wrong silently
 *     skews the composite.
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

import {
  aiMetricsSchema,
  type AiMetrics,
} from "@/lib/scoring/engine";

// ════════════════════════════════════════════════════════════════════════
// Model selection — same fallback chain semantics as analyze-skin.ts
// ════════════════════════════════════════════════════════════════════════

function getGeminiModelIds(): string[] {
  const override = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
  if (override) {
    const parsed = override
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  return ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
}

function getApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) env var"
    );
  }
  return key;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  if (fence) return fence[1].trim();
  return trimmed;
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("504") ||
    lower.includes("service unavailable") ||
    lower.includes("overloaded") ||
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("network") ||
    lower.includes("resource has been exhausted")
  );
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateWithRetry(
  model: GenerativeModel,
  parts: Parameters<GenerativeModel["generateContent"]>[0]
) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ════════════════════════════════════════════════════════════════════════
// System prompt — locks the JSON schema + scoring direction conventions
// ════════════════════════════════════════════════════════════════════════
//
// CRITICAL: directions in this prompt match SPEC §7.A. If you reword these,
// the composite score will silently drift. The engine inverts pigmentation/
// pore/wrinkle/redness; sebum is U-shaped; acne is severity-counts. The
// prompt MUST tell Gemini to report raw (uninverted) numbers using the
// "low value = ..." vocabulary so we don't double-invert downstream.

const SYSTEM_PROMPT = `Bạn là một AI Vision phân tích da chuyên nghiệp. Người dùng vừa cung cấp 3 ảnh selfie: chính diện, nghiêng trái 45°, nghiêng phải 45°. Mục tiêu của bạn là phân tích cả 3 ảnh và trả về một JSON DUY NHẤT chứa 11 chỉ số sinh lý da theo schema dưới đây.

QUY TẮC TUYỆT ĐỐI:
- KHÔNG chẩn đoán y tế. Bạn chỉ trả về các chỉ số đo lường hình ảnh.
- CHỈ trả về JSON hợp lệ, không markdown, không code fence, không văn bản thừa.
- Dùng cả 3 ảnh để phủ đủ 9 vùng (trán, thái dương, quanh mắt, mũi, gò má, má, quanh miệng, cằm, xương hàm).
- Nếu không xác định được một chỉ số do ảnh không rõ, vẫn trả về số ước lượng tốt nhất — KHÔNG để null cho các trường bắt buộc.

SCHEMA JSON (bắt buộc đúng key + đúng kiểu):
{
  "hydration": number 0–100,            // 0 = rất khô / 100 = đủ ẩm. Càng cao càng TỐT.
  "sebum": number 0–100,                // 0 = rất khô / 50 = cân bằng (TỐT NHẤT) / 100 = rất dầu. Đây là MỨC ĐO tuyến bã nhờn, KHÔNG phải điểm chất lượng — báo cáo đúng mức bạn quan sát thấy.
  "acne": {
    "mild":     number int ≥ 0,         // mụn nhẹ: comedone (đầu trắng / đầu đen nhẹ)
    "moderate": number int ≥ 0,         // mụn vừa: papule (mụn đỏ không mủ)
    "severe":   number int ≥ 0,         // mụn nặng: pustule (có mủ) hoặc nodule (cục dưới da)
    "count_by_type": {
      "comedone": number int ≥ 0,
      "papule":   number int ≥ 0,
      "pustule":  number int ≥ 0,
      "nodule":   number int ≥ 0
    }
  },
  "pore":               number 0–100,   // 0 = lỗ chân lông rất nhỏ / 100 = rất to. Càng cao càng XẤU.
  "pigmentation":       number 0–100,   // 0 = không thâm nám / 100 = thâm nám nặng. Càng cao càng XẤU.
  "wrinkle":            number 0–100,   // 0 = không nếp nhăn / 100 = nhiều nếp nhăn sâu. Càng cao càng XẤU.
  "skin_tone_evenness": number 0–100,   // 0 = sắc tố không đều / 100 = đều màu. Càng cao càng TỐT.
  "redness":            number 0–100,   // 0 = không đỏ/kích ứng / 100 = rất đỏ. Càng cao càng XẤU.
  "texture":            number 0–100,   // 0 = thô ráp / 100 = mịn. Càng cao càng TỐT.
  "dark_circles":       number 0–100,   // 0 = không quầng thâm / 100 = quầng thâm rõ. Càng cao càng XẤU.
  "blackheads": {
    "count":    number int ≥ 0,         // ước lượng số mụn đầu đen (vùng mũi/cằm)
    "severity": number 0–100             // 0 = sạch / 100 = dày đặc
  },
  "sagging": number 0–100 | omit        // CHỈ trả về nếu user > 35 tuổi (xem context onboarding). Bỏ key này nếu không áp dụng.
}

LƯU Ý CHẤM ĐIỂM:
- "sebum" KHÔNG đảo chiều: nếu da rõ ràng dầu nặng → ~85, nếu khô tróc → ~15, nếu cân bằng → ~50. Người dùng dầu nhiều sẽ được hệ thống xuôi-gẩy điểm cuối ở engine, bạn KHÔNG đảo trước.
- "acne" báo COUNT theo từng cấp severity. Nếu không thấy mụn → tất cả = 0.
- Mọi chỉ số 0–100 còn lại đều báo "raw observation". Engine sẽ tự đảo chiều cho pigmentation/pore/wrinkle/redness.

Trả về JSON duy nhất ngay sau dấu hai chấm cuối câu này:`;

// ════════════════════════════════════════════════════════════════════════
// Onboarding context — concise so the prompt budget stays tight
// ════════════════════════════════════════════════════════════════════════

export type AnalyzeMetricsImage = {
  mimeType: string;
  data: string; // base64, no data URL prefix
};

export type AnalyzeMetricsContext = {
  age_group?: string | null;
  gender?: string | null;
  goals?: string[] | null;
  skin_type_self_reported?: string | null;
  location?: string | null;
  // Free-form note appended verbatim — used when caller wants to feed extra
  // habits/budget context without expanding this type every release.
  extra_notes?: string | null;
};

function buildUserPrompt(ctx: AnalyzeMetricsContext | null): string {
  const lines: string[] = [
    "Phân tích 3 ảnh dưới (chính diện, nghiêng trái, nghiêng phải) và trả về JSON đúng schema. CHỈ JSON, không thêm gì khác.",
  ];
  if (ctx) {
    lines.push("", "Context onboarding (tham khảo, không bắt buộc dùng):");
    if (ctx.age_group) lines.push(`- Nhóm tuổi: ${ctx.age_group}`);
    if (ctx.gender) lines.push(`- Giới tính: ${ctx.gender}`);
    if (ctx.goals?.length)
      lines.push(`- Mục tiêu: ${ctx.goals.join(", ")}`);
    if (ctx.skin_type_self_reported)
      lines.push(`- Loại da tự đánh giá: ${ctx.skin_type_self_reported}`);
    if (ctx.location) lines.push(`- Vị trí: ${ctx.location}`);
    if (ctx.extra_notes) lines.push(`- Ghi chú: ${ctx.extra_notes}`);
  }
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════

/**
 * Run the 11-metric analysis on a triple of images.
 *
 * @throws if the model output cannot be parsed against `aiMetricsSchema`
 *         after one retry, or if all model fallbacks return 503.
 */
export async function analyzeSkinMetrics(
  images: AnalyzeMetricsImage[],
  context: AnalyzeMetricsContext | null
): Promise<AiMetrics> {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("analyzeSkinMetrics: images array must be non-empty");
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  const userPrompt = buildUserPrompt(context);

  const parts: Parameters<GenerativeModel["generateContent"]>[0] = [
    userPrompt,
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    })),
  ];

  const modelIds = getGeminiModelIds();
  let lastErr: unknown;

  for (const modelId of modelIds) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          // Lower temperature — we want consistent metric numbers, not
          // creative narration (the narrative analyzer is a separate call).
          temperature: 0.3,
        },
      });

      const result = await generateWithRetry(model, parts);
      const text = result.response.text();
      if (!text) throw new Error("Empty response from model");

      try {
        const parsed: unknown = JSON.parse(stripJsonFence(text));
        return aiMetricsSchema.parse(parsed);
      } catch {
        // One repair attempt — Gemini occasionally wraps in code-fence or
        // emits trailing commentary despite the system prompt.
        const retry = await generateWithRetry(model, [
          `${userPrompt}\n\nCâu trả lời trước không phải JSON hợp lệ theo schema. Hãy phản hồi lại CHỈ với một đối tượng JSON duy nhất, không code fence, không văn bản kèm theo.`,
          ...images.map((img) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
          })),
        ]);
        const retryText = retry.response.text();
        if (!retryText) throw new Error("Empty retry response from model");
        const parsed: unknown = JSON.parse(stripJsonFence(retryText));
        return aiMetricsSchema.parse(parsed);
      }
    } catch (err) {
      lastErr = err;
      if (isRetryableError(err) && modelId !== modelIds[modelIds.length - 1]) {
        console.warn(
          `Gemini metric model ${modelId} failed (${(err as Error)?.message}); falling back to next model.`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr ?? new Error("All Gemini models exhausted");
}
