import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const skinAnalysisSchema = z.object({
  skin_type: z.string(),
  concerns: z.array(z.string()),
  morning_routine: z.array(z.string()),
  evening_routine: z.array(z.string()),
  ingredients: z.array(z.string()),
});

export type SkinAnalysis = z.infer<typeof skinAnalysisSchema>;

const SYSTEM_PROMPT = `Bạn là một chuyên gia AI về Da liễu chuyên nghiệp. Hãy phân tích hình ảnh da mặt của người dùng.

Xác định loại da (Da dầu, Da khô, Da hỗn hợp).

Phát hiện các vấn đề về da (Các loại mụn: mụn viêm, mụn ẩn; Đỏ da; Đốm thâm).

Cung cấp quy trình chăm sóc da buổi sáng và buổi tối.

Gợi ý các hoạt chất (ví dụ: Salicylic Acid, Niacinamide).

Phản hồi hoàn toàn bằng tiếng Việt.

Kết quả trả về phải tuân thủ nghiêm ngặt định dạng JSON với các trường: skin_type, concerns[], morning_routine[], evening_routine[], ingredients[].`;

/** Override with GOOGLE_GENERATIVE_AI_MODEL (e.g. gemini-1.5-flash, gemini-2.0-flash). */
export function getGeminiModelId(): string {
  return (
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || "gemini-1.5-flash"
  );
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

export async function analyzeSkinImage(
  buffer: Buffer,
  mimeType: string,
  onboardingContext?: any
): Promise<SkinAnalysis> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelId(),
    systemInstruction: SYSTEM_PROMPT,
  });

  const base64 = buffer.toString("base64");

  let prompt =
    "Hãy phân tích hình ảnh da mặt này và chỉ trả về JSON hợp lệ khớp với schema yêu cầu. Không sử dụng markdown, không giải thích ngoài JSON.";

  if (onboardingContext) {
    prompt += `\n\nThông tin bổ sung về người dùng để bạn tham khảo cho việc phân tích và gợi ý quy trình:
    - Vị trí: ${onboardingContext.location}
    - Môi trường: ${onboardingContext.environment === "office" ? "Văn phòng máy lạnh" : "Ngoài trời"}
    - Thói quen: Uống nước ${onboardingContext.habits?.water === "low" ? "ít" : "đủ"}, Giấc ngủ ${onboardingContext.habits?.sleep === "late" ? "thức khuya" : "đủ giấc"}
    - Các hoạt chất đang dùng: ${onboardingContext.current_treatments?.join(", ") || "Không có"}
    - Mục tiêu chính: ${onboardingContext.primary_goal}
    Hãy cân nhắc các yếu tố môi trường và thói quen này khi gợi ý quy trình và hoạt chất.`;
  }

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);

  const text = result.response.text();
  if (!text) {
    throw new Error("Empty response from model");
  }

  try {
    return parseAnalysisJson(text);
  } catch {
    const retry = await model.generateContent([
      `${prompt}\n\nCâu trả lời trước của bạn không phải là JSON hợp lệ. Hãy phản hồi lại một lần nữa CHỈ với một đối tượng JSON duy nhất, không sử dụng khối mã (code fences).`,
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
}
