"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ImageIcon,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AffiliateProductGrid } from "@/components/skin-scanner/affiliate-product-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { compressImage } from "@/lib/image/compress";
import type { SkinAnalysis } from "@/lib/gemini/analyze-skin";
import type { MatchedProductResult } from "@/lib/products/matcher";
import { t } from "@/lib/translations";
import type { ProductCategoryId } from "@/types/skin-analysis";

type Phase = "guide" | "camera" | "analyzing" | "result";

type ApiOk = {
  analysis: SkinAnalysis;
  recommendedProducts: Record<ProductCategoryId, MatchedProductResult>;
  disclaimer: string;
  scanId: string | null;
};

// Labor-illusion: rotating copy personalized from onboarding context so the
// loading state feels like the AI is actually reasoning over the user's data.
function analysisPhrases(ctx: unknown): string[] {
  const c = (ctx ?? {}) as {
    location?: string | null;
    habits?: { water?: string; sleep?: string };
    primary_goal?: string;
  };
  return [
    c.location
      ? `Đang đọc dữ liệu thời tiết tại ${c.location}...`
      : "Đang đọc dữ liệu môi trường chung...",
    "Phân tích cấu trúc lỗ chân lông...",
    c.habits?.sleep === "late"
      ? "Đối soát thói quen ngủ với tình trạng quầng thâm..."
      : "Kiểm tra hàng rào bảo vệ da...",
    c.habits?.water === "low"
      ? "Đánh giá mức độ hydrat hoá của da..."
      : "Phân tích độ đàn hồi và cấp ẩm...",
    "Tối ưu quy trình cho mục tiêu của bạn...",
  ];
}

// Minimum time spent in the analyzing phase so the labor illusion is
// preserved even when Gemini responds faster than the phrase rotation.
const MIN_ANALYZING_MS = 4000;
const PHRASE_INTERVAL_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function SkinScanner({
  onboardingContext,
}: {
  onboardingContext?: unknown;
}) {
  const [phase, setPhase] = useState<Phase>("guide");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const phrases = analysisPhrases(onboardingContext);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Rotate labor-illusion phrases while analyzing.
  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, phrases.length]);

  const runAnalysis = async (file: File) => {
    setError(null);
    setResult(null);
    setPhraseIdx(0);
    setPhase("analyzing");
    const start = Date.now();

    try {
      // Task 7 — resize to 2K, JPEG q=0.9 before uploading.
      const compressed = await compressImage(file, {
        maxWidth: 2048,
        quality: 0.9,
      });

      const dataUrl = `data:${compressed.mimeType};base64,${compressed.base64}`;
      setPreviewUrl(dataUrl);

      const res = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: { mimeType: compressed.mimeType, data: compressed.base64 },
          onboardingContext,
        }),
      });

      const payload: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : t("scanner.error_generic");
        throw new Error(msg);
      }

      // Hold minimum duration so the rotating copy gets a full sweep even
      // if the API returns in sub-second.
      const elapsed = Date.now() - start;
      if (elapsed < MIN_ANALYZING_MS) {
        await sleep(MIN_ANALYZING_MS - elapsed);
      }

      setResult(payload as ApiOk);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scanner.error_generic"));
      setPhase("guide");
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("scanner.error_not_image"));
      return;
    }
    await runAnalysis(f);
  };

  const startCamera = async () => {
    setError(null);
    setPhase("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      // videoRef is mounted when the camera view renders; attach on next tick.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch {
      setError(t("scanner.error_camera"));
      setPhase("guide");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError(t("scanner.error_camera"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );
    if (!blob) {
      setError(t("scanner.error_capture"));
      return;
    }
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    stopCamera();
    await runAnalysis(file);
  };

  const restart = () => {
    setPhase("guide");
    setResult(null);
    setError(null);
    setPreviewUrl(null);
  };

  return (
    <section
      id="scanner"
      className="scroll-mt-20 border-b border-border bg-card/50 px-4 py-14 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("scanner.title")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("scanner.description")}
        </p>

        <Card className="mt-8 overflow-hidden">
          <CardContent className="min-h-[520px] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {phase === "guide" && (
                <motion.div
                  key="guide"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="relative mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-32 w-32 text-primary/70"
                      aria-hidden
                    >
                      <circle
                        cx="50"
                        cy="42"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        d="M20 92 Q50 64 80 92"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <CornerAccent x={8} y={8} />
                      <CornerAccent x={92} y={8} flipX />
                      <CornerAccent x={8} y={92} flipY />
                      <CornerAccent x={92} y={92} flipX flipY />
                    </svg>
                  </div>

                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-semibold">Chuẩn bị chụp ảnh</h3>
                    <p className="text-sm text-muted-foreground">
                      Ba gợi ý nhỏ để AI đọc da chuẩn nhất.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <TipCard
                      icon="🔆"
                      title="Đủ ánh sáng"
                      body="Đứng gần cửa sổ hoặc đèn trắng, tránh bóng gắt."
                    />
                    <TipCard
                      icon="🎯"
                      title="Mặt thẳng"
                      body="Nhìn thẳng vào camera, không nghiêng đầu."
                    />
                    <TipCard
                      icon="🚫"
                      title="Không filter"
                      body="Tắt beauty mode và filter để AI thấy da thật."
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => void startCamera()}
                    >
                      <Camera className="size-4" />
                      Mở máy ảnh
                    </Button>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="sr-only"
                      />
                      <span className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5">
                        <ImageIcon className="size-4" />
                        Tải ảnh từ thư viện
                      </span>
                    </label>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>{t("scanner.error_title")}</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {phase === "camera" && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      playsInline
                      muted
                    />
                    <CameraFrameOverlay />
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopCamera();
                        setPhase("guide");
                      }}
                    >
                      Quay lại
                    </Button>
                    <Button size="lg" onClick={() => void capturePhoto()}>
                      <Camera className="size-4" />
                      Chụp ảnh
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                    {previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Scan"
                        className="h-full w-full object-cover opacity-80"
                      />
                    )}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent"
                      initial={{ top: 0 }}
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <CameraFrameOverlay />
                  </div>

                  <div className="space-y-3 text-center">
                    <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" />
                      Deep analysis
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={phraseIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium text-foreground"
                      >
                        {phrases[phraseIdx]}
                      </motion.p>
                    </AnimatePresence>
                    <div className="flex justify-center gap-1 pt-1">
                      {phrases.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 w-6 rounded-full transition-colors ${
                            i === phraseIdx ? "bg-primary" : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === "result" && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-6 sm:grid-cols-5"
                >
                  <div className="sm:col-span-2">
                    <div className="sm:sticky sm:top-6">
                      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                        {previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="Scan"
                            className="h-full w-full object-cover"
                          />
                        )}
                        <CameraFrameOverlay />
                      </div>
                      <div className="mt-3 flex justify-center">
                        <Button variant="outline" onClick={restart}>
                          <RefreshCcw className="size-4" />
                          Quét lại
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 sm:col-span-3">
                    <Alert>
                      <AlertTitle>{t("scanner.important_title")}</AlertTitle>
                      <AlertDescription>{result.disclaimer}</AlertDescription>
                    </Alert>

                    <div>
                      <h3 className="text-lg font-semibold">
                        {t("scanner.summary_title")}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {t("scanner.skin_type_label")}
                        </span>{" "}
                        {result.analysis.skin_type}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        {t("scanner.concerns_title")}
                      </h4>
                      <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                        {result.analysis.concerns.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">
                          {t("scanner.morning_routine_title")}
                        </h4>
                        <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                          {result.analysis.morning_routine.map((step, i) => (
                            <li key={`m-${i}`}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("scanner.evening_routine_title")}
                        </h4>
                        <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                          {result.analysis.evening_routine.map((step, i) => (
                            <li key={`e-${i}`}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">
                        {t("scanner.suggested_actives_title")}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.analysis.ingredients.map((ing) => (
                          <span
                            key={ing}
                            className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-3 text-lg font-semibold">
                        {t("scanner.product_ideas_title")}
                      </h3>
                      <AffiliateProductGrid
                        recommendedProducts={result.recommendedProducts}
                        scanId={result.scanId}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TipCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

// Four L-shaped corner marks + a focus ring, purely decorative.
function CameraFrameOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <span className="absolute left-3 top-3 size-6 border-l-2 border-t-2 border-primary/80" />
      <span className="absolute right-3 top-3 size-6 border-r-2 border-t-2 border-primary/80" />
      <span className="absolute bottom-3 left-3 size-6 border-b-2 border-l-2 border-primary/80" />
      <span className="absolute bottom-3 right-3 size-6 border-b-2 border-r-2 border-primary/80" />
      <span className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
    </div>
  );
}

// L-shape decoration for the SVG illustration frame.
function CornerAccent({
  x,
  y,
  flipX,
  flipY,
}: {
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const dx = flipX ? -8 : 8;
  const dy = flipY ? -8 : 8;
  return (
    <path
      d={`M ${x} ${y + dy} L ${x} ${y} L ${x + dx} ${y}`}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  );
}
