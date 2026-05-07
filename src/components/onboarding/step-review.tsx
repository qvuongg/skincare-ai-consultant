"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScoreReport } from "@/components/report/score-report";
import type { ReportContext } from "@/components/report/insights";
import type { ScanReportPayload } from "@/components/report/types";
import {
  getAgeRangeLabel,
  type AgeRangeId,
} from "@/components/onboarding/step-age";
import {
  getDietLabels,
  type DietOptionId,
} from "@/components/onboarding/step-diet";
import {
  getEnvironmentLabel,
  type EnvironmentId,
} from "@/components/onboarding/step-environment";
import { Button } from "@/components/ui/button";

// Mirrors the JSON the `/api/analyze-skin` triple-image branch returns.
// Re-exported from the report types module so this component and the
// report layer share one source of truth.
export type AnalysisResult = ScanReportPayload;

type Props = {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  userName: string;
  /** Pre-resolved Vietnamese label of the user's first primary goal,
   *  e.g. "Trị mụn". `null` when the user skipped goal selection. */
  primaryGoal: string | null;
  location: string | null;
  sleepHours: number;
  waterLiters: number;
  /** From onboarding — surfaced in the report's hero badge. */
  skinType?: string | null;
  /** Raw onboarding ids — the report layer resolves labels via the
   *  exported helpers from each step component. */
  ageRange?: AgeRangeId | null;
  workEnvironment?: EnvironmentId | null;
  diet?: DietOptionId[];
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
  skinType = null,
  ageRange = null,
  workEnvironment = null,
  diet = [],
  previewUrl,
  onRetry,
}: Props) {
  // Resolve once at this boundary — every child consumes the bag.
  const reportCtx: ReportContext = useMemo(
    () => ({
      userName,
      goalLabel: primaryGoal,
      ageId: ageRange,
      ageLabel: getAgeRangeLabel(ageRange),
      location,
      workEnvId: workEnvironment,
      workEnvLabel: getEnvironmentLabel(workEnvironment),
      dietIds: diet,
      dietLabels: getDietLabels(diet),
      waterLiters,
      sleepHours,
    }),
    [
      userName,
      primaryGoal,
      ageRange,
      location,
      workEnvironment,
      diet,
      waterLiters,
      sleepHours,
    ]
  );
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

  return (
    <ScoreReport
      result={result}
      ctx={reportCtx}
      skinType={skinType}
      onRetry={onRetry}
    />
  );
}
