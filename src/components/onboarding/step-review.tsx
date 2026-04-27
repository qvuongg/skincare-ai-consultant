"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AffiliateProductGrid } from "@/components/skin-scanner/affiliate-product-grid";
import { Button } from "@/components/ui/button";
import type { SkinAnalysis } from "@/lib/gemini/analyze-skin";
import type { MatchedProductResult } from "@/lib/products/matcher";
import type { ProductCategoryId } from "@/types/skin-analysis";

export type AnalysisResult = {
  analysis: SkinAnalysis;
  recommendedProducts: Record<ProductCategoryId, MatchedProductResult>;
  disclaimer: string;
  scanId: string | null;
};

type Props = {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  userName: string;
  primaryGoal: string | null;
  location: string | null;
  sleepHours: number;
  waterLiters: number;
  previewUrl: string | null;
  onRetry: () => void;
};

const PHRASE_INTERVAL_MS = 1600;

function buildPhrases(opts: {
  location: string | null;
  sleepHours: number;
  waterLiters: number;
  primaryGoal: string | null;
}): string[] {
  const place = opts.location ?? "vị trí của bạn";
  const sleep = opts.sleepHours;
  const water = opts.waterLiters;

  return [
    `Đang đối chiếu thói quen ngủ tại ${place}...`,
    "Phân tích cấu trúc lỗ chân lông...",
    sleep < 6
      ? "Đối soát quầng thâm với giấc ngủ ngắn..."
      : "Kiểm tra hàng rào bảo vệ da...",
    water < 1.5
      ? `Đánh giá độ hydrat hoá — ${water}L nước hơi ít đó...`
      : "Phân tích độ đàn hồi và cấp ẩm...",
    "Quét tone da, sắc tố melanin...",
    opts.primaryGoal === "anti_aging"
      ? "Tối ưu routine chống lão hoá..."
      : opts.primaryGoal === "clear_acne"
      ? "Tối ưu phác đồ điều trị mụn..."
      : "Tối ưu routine cấp ẩm sâu...",
  ];
}

export function StepReview({
  loading,
  error,
  result,
  userName,
  primaryGoal,
  location,
  sleepHours,
  waterLiters,
  previewUrl,
  onRetry,
}: Props) {
  const phrases = useMemo(
    () => buildPhrases({ location, sleepHours, waterLiters, primaryGoal }),
    [location, sleepHours, waterLiters, primaryGoal]
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % phrases.length),
      PHRASE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [loading, phrases.length]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div
          className="flex flex-col items-center gap-3 p-6"
          style={{
            borderRadius: "1.75rem",
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <p className="text-[15px] font-semibold text-foreground">
            Mika gặp trục trặc khi đọc da 😢
          </p>
          <p className="max-w-[280px] text-[13px] text-foreground/65">
            {error}
          </p>
          <Button
            size="lg"
            onClick={onRetry}
            className="mt-2 h-12 rounded-full bg-foreground text-background hover:bg-foreground/85"
          >
            <RotateCcw className="size-4" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
            <span className="size-1.5 rounded-full bg-foreground/70" />
            Bước 06 · Deep Analysis
          </span>
          <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
            Mika đang scan da{userName ? ` của ${userName}` : ""}…
          </h1>
          <p className="text-[14px] leading-relaxed text-foreground/65">
            Quá trình này lấy ~5 giây, đủ để Mika đọc kỹ từng vùng nhỏ.
          </p>
        </header>

        <div className="mt-8 flex flex-1 flex-col items-center justify-center">
          <div
            className="relative aspect-[3/4] w-full max-w-[300px] overflow-hidden"
            style={{
              borderRadius: "2rem",
              background: "rgba(15,15,30,0.85)",
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow:
                "0 30px 80px rgba(31,38,135,0.30), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            {previewUrl && (
              // Data URL preview — Next/Image requires remotePatterns for
              // remote sources, and this is a base64 in-memory blob anyway.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Ảnh đang scan"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-[3px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(168,85,247,0.95), rgba(59,130,246,0.95), transparent)",
                boxShadow: "0 0 24px rgba(168,85,247,0.7)",
              }}
              initial={{ top: 0 }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-3 size-6 border-l-2 border-t-2 border-purple-300/80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 size-6 border-r-2 border-t-2 border-purple-300/80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 left-3 size-6 border-b-2 border-l-2 border-purple-300/80"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 right-3 size-6 border-b-2 border-r-2 border-purple-300/80"
            />
          </div>

          <div className="mt-6 w-full text-center">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/55">
              <Sparkles className="size-3.5" /> Deep analysis
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 px-4 text-[15px] font-semibold tracking-tight text-foreground"
              >
                {phrases[idx]}
              </motion.p>
            </AnimatePresence>
            <div className="mt-3 flex justify-center gap-1.5">
              {phrases.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-6 rounded-full transition-colors ${
                    i === idx ? "bg-foreground/80" : "bg-foreground/15"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { analysis, recommendedProducts, disclaimer, scanId } = result;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <Sparkles className="size-3" />
          Kết quả của bạn
        </span>
        <h1 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-tight text-foreground">
          {userName ? `${userName} ơi, ` : ""}đây là chân dung da hiện tại
        </h1>
        {analysis.vibe_note && (
          <p className="text-[14px] leading-relaxed text-foreground/65">
            {analysis.vibe_note}
          </p>
        )}
      </header>

      <ResultCard title="Loại da Mika đọc được" tone="purple">
        <p className="text-[18px] font-semibold tracking-tight text-foreground">
          {analysis.skin_type}
        </p>
      </ResultCard>

      {analysis.concerns.length > 0 && (
        <ResultCard title="Vấn đề nổi bật" tone="blue">
          <ul className="space-y-1.5 text-[14px] text-foreground/75">
            {analysis.concerns.slice(0, 5).map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/55" />
                {c}
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {analysis.lifestyle_insights && analysis.lifestyle_insights.length > 0 && (
        <ResultCard title="Nhịp sống đang ảnh hưởng đến da" tone="green">
          <ul className="space-y-2 text-[14px] leading-relaxed text-foreground/75">
            {analysis.lifestyle_insights.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                {i}
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      <div className="grid grid-cols-1 gap-3">
        <ResultCard title="Routine buổi sáng" tone="purple">
          <ol className="space-y-1.5 text-[14px] text-foreground/75">
            {analysis.morning_routine.map((s, i) => (
              <li key={`m-${i}`} className="flex gap-2">
                <span className="font-semibold text-foreground/55 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </ResultCard>

        <ResultCard title="Routine buổi tối" tone="blue">
          <ol className="space-y-1.5 text-[14px] text-foreground/75">
            {analysis.evening_routine.map((s, i) => (
              <li key={`e-${i}`} className="flex gap-2">
                <span className="font-semibold text-foreground/55 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </ResultCard>
      </div>

      {analysis.ingredients.length > 0 && (
        <ResultCard title="Hoạt chất nên có trong tủ" tone="green">
          <div className="flex flex-wrap gap-2">
            {analysis.ingredients.map((ing) => (
              <span
                key={ing}
                className="rounded-full border border-white/65 bg-white/65 px-3 py-1.5 text-[12px] font-medium text-foreground/80"
              >
                {ing}
              </span>
            ))}
          </div>
        </ResultCard>
      )}

      <ResultCard title="Sản phẩm Mika gợi ý" tone="purple">
        <AffiliateProductGrid
          recommendedProducts={recommendedProducts}
          scanId={scanId}
        />
      </ResultCard>

      <p
        className="rounded-2xl border border-white/55 bg-white/45 p-4 text-[11px] leading-relaxed text-foreground/55"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {disclaimer}
      </p>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          size="lg"
          onClick={onRetry}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          Scan lại lần nữa <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const TONE_BG: Record<"purple" | "blue" | "green", string> = {
  purple:
    "linear-gradient(135deg, rgba(168,85,247,0.10), rgba(255,255,255,0.55))",
  blue:
    "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.55))",
  green:
    "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(255,255,255,0.55))",
};

function ResultCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "purple" | "blue" | "green";
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden p-5"
      style={{
        borderRadius: "1.75rem",
        background: TONE_BG[tone],
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "0 14px 36px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/55">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </section>
  );
}
