import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";

export const skinAnalysisSchema = z.object({
  skin_type: z.string(),
  concerns: z.array(z.string()),
  morning_routine: z.array(z.string()),
  evening_routine: z.array(z.string()),
  ingredients: z.array(z.string()),
  lifestyle_insights: z.array(z.string()).optional().default([]),
  vibe_note: z.string().optional().default(""),
});

export type SkinAnalysis = z.infer<typeof skinAnalysisSchema>;

const SYSTEM_PROMPT = `Bạn là "skin bestie" AI cho GenZ Việt — hiểu biết như chuyên gia da liễu nhưng nói chuyện chill, gần gũi, không giáo điều.

Phong cách:
- Ngôn ngữ GenZ Việt Nam tự nhiên, thân thiện (vd: "da bạn đang hơi tụt mood", "mình gợi ý bạn thử..."), không lạm dụng tiếng lóng khó hiểu.
- Luôn KẾT NỐI thói quen sống (thức khuya, ít uống nước, môi trường máy lạnh, stress, đồ ăn cay/ngọt...) với những gì quan sát được trên da. Đây là điểm khác biệt chính của bạn.
- Cá nhân hóa theo onboarding context — không nói chung chung.
- Không phán xét, không dọa dẫm. Tôn trọng ngân sách và thời gian của người trẻ.

Nhiệm vụ:
1. Xác định skin_type (Da dầu / Da khô / Da hỗn hợp / Da thường / Da nhạy cảm).
2. Liệt kê concerns cụ thể (mụn viêm, mụn ẩn, thâm mụn, lỗ chân lông to, xỉn màu, đỏ da, v.v.).
3. Viết 2-4 lifestyle_insights — mỗi cái nối MỘT thói quen từ context với MỘT dấu hiệu trên da (vd: "Thức khuya + uống ít nước đang làm vùng chữ T bóng dầu và da xỉn hơn").
4. Đề xuất morning_routine và evening_routine (3-5 bước mỗi routine, ngắn gọn, actionable).
5. Liệt kê ingredients chủ động phù hợp (vd: Niacinamide, Salicylic Acid, Hyaluronic Acid, Centella Asiatica).
6. Viết vibe_note — 1-2 câu động viên khép lại, tone tích cực.

OUTPUT: CHỈ trả về một JSON hợp lệ, KHÔNG markdown, KHÔNG code fence, KHÔNG text thừa. Schema bắt buộc: skin_type, concerns[], morning_routine[], evening_routine[], ingredients[], lifestyle_insights[], vibe_note.`;

/**
 * Model fallback chain: try each in order, fall through to the next on
 * persistent 503 (capacity). Override with GOOGLE_GENERATIVE_AI_MODEL —
 * accepts a single model or a comma-separated list.
 * NOTE: gemini-1.5-* was deprecated by Google in Sept 2025 — do not use.
 */
export function getGeminiModelIds(): string[] {
  const override = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
  if (override) {
    const parsed = override
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  return ["gemini-2.5-flash", "gemini-2.0-flash"];
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

function parseAnalysisJson(raw: string): SkinAnalysis {
  const cleaned = stripJsonFence(raw);
  const parsed: unknown = JSON.parse(cleaned);
  return skinAnalysisSchema.parse(parsed);
}

function isRetryable503(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    msg.includes("503") ||
    lower.includes("service unavailable") ||
    lower.includes("overloaded") ||
    lower.includes("model is overloaded")
  );
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

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
      if (attempt < MAX_RETRIES && isRetryable503(err)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

type OnboardingContext = {
  location?: string | null;
  environment?: string;
  habits?: { water?: string; sleep?: string };
  current_treatments?: string[];
  primary_goal?: string;
};

export async function analyzeSkinImage(
  buffer: Buffer,
  mimeType: string,
  onboardingContext?: unknown
): Promise<SkinAnalysis> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const base64 = buffer.toString("base64");

  let prompt =
    "Hãy phân tích hình ảnh da mặt này và chỉ trả về JSON hợp lệ khớp với schema yêu cầu. Không sử dụng markdown, không giải thích ngoài JSON.";

  if (onboardingContext && typeof onboardingContext === "object") {
    const ctx = onboardingContext as OnboardingContext;
    const env = ctx.environment;
    const water = ctx.habits?.water;
    const sleepHabit = ctx.habits?.sleep;
    prompt += `\n\nContext người dùng (BẮT BUỘC lồng ghép vào lifestyle_insights và gợi ý):
    - Vị trí: ${ctx.location ?? "không rõ"}
    - Môi trường: ${env === "office" ? "Văn phòng máy lạnh" : env === "outdoor" ? "Ngoài trời" : env ?? "không rõ"}
    - Thói quen: Uống nước ${water === "low" ? "ít" : water === "high" ? "nhiều" : "đủ"}, Giấc ngủ ${sleepHabit === "late" ? "thức khuya" : sleepHabit === "early" ? "sớm" : "đủ giấc"}
    - Các hoạt chất đang dùng: ${ctx.current_treatments?.join(", ") || "Không có"}
    - Mục tiêu chính: ${ctx.primary_goal ?? "chưa xác định"}`;
  }

  const parts = [
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
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
          temperature: 0.7,
        },
      });

      const result = await generateWithRetry(model, parts);
      const text = result.response.text();
      if (!text) {
        throw new Error("Empty response from model");
      }

      try {
        return parseAnalysisJson(text);
      } catch {
        const retry = await generateWithRetry(model, [
          `${prompt}\n\nCâu trả lời trước không phải JSON hợp lệ. Hãy phản hồi lại CHỈ với một đối tượng JSON duy nhất, không code fence.`,
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ]);
        const retryText = retry.response.text();
        if (!retryText) throw new Error("Empty retry response from model");
        return parseAnalysisJson(retryText);
      }
    } catch (err) {
      lastErr = err;
      if (isRetryable503(err) && modelId !== modelIds[modelIds.length - 1]) {
        console.warn(
          `Gemini model ${modelId} exhausted retries with 503; falling back to next model.`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr ?? new Error("All Gemini models exhausted");
}
