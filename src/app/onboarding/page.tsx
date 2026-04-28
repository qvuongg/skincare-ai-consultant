"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { ProgressPillBar } from "@/components/onboarding/progress-pill-bar";
import { StepGoal } from "@/components/onboarding/step-goal";
import {
  StepLifestyle,
  type LifestyleData,
} from "@/components/onboarding/step-lifestyle";
import { StepName } from "@/components/onboarding/step-name";
import { StepPhotoScan } from "@/components/onboarding/step-photo-scan";
import {
  StepReview,
  type AnalysisResult,
} from "@/components/onboarding/step-review";
import { StepSkinType } from "@/components/onboarding/step-skin-type";
import { compressImage } from "@/lib/image/compress";

const STEP_KEYS = [
  "goal",
  "name",
  "skin",
  "lifestyle",
  "photo",
  "review",
] as const;
type StepKey = (typeof STEP_KEYS)[number];

const MIN_ANALYZING_MS = 4000;

type FormData = {
  primary_goal: string | null;
  user_name: string;
  skin_type: string | null;
  lifestyle: LifestyleData;
};

const INITIAL: FormData = {
  primary_goal: null,
  user_name: "",
  skin_type: null,
  lifestyle: {
    location: null,
    uv_index: null,
    humidity: null,
    water_liters: 1.5,
    sleep_hours: 7,
  },
};

// iOS 26 "elastic bounce" — a stiff spring with low damping.
const PAGE_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stepKey: StepKey = STEP_KEYS[stepIndex];
  const next = useCallback(
    () => setStepIndex((s) => Math.min(s + 1, STEP_KEYS.length - 1)),
    []
  );
  const back = useCallback(
    () => setStepIndex((s) => Math.max(s - 1, 0)),
    []
  );

  const submitOnboarding = useCallback((d: FormData) => {
    const payload = {
      user_name: d.user_name,
      name: d.user_name,
      primary_goal: d.primary_goal ?? "Chưa chọn",
      skin_type_detected: d.skin_type ?? "Chưa phân loại",
      contact_info: "Chưa cung cấp",
      location: d.lifestyle.location,
      weather_context:
        d.lifestyle.uv_index !== null
          ? {
              uv_index: d.lifestyle.uv_index,
              humidity: d.lifestyle.humidity ?? 0,
            }
          : null,
      habits: {
        water: d.lifestyle.water_liters >= 1.5 ? "normal" : "low",
        sleep: d.lifestyle.sleep_hours >= 7 ? "enough" : "late",
        water_liters: d.lifestyle.water_liters,
        sleep_hours: d.lifestyle.sleep_hours,
      },
      raw_data: d,
    };
    // Fire-and-forget — Supabase failures shouldn't block the UX.
    void fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((e) => console.error("onboarding save failed", e));
  }, []);

  const runAnalysis = useCallback(
    async (file: File, snapshot: FormData) => {
      setAnalysisError(null);
      setAnalysisResult(null);
      setAnalysisLoading(true);
      const start = Date.now();

      try {
        // Reuse compression pipeline from Task 7 — 2K, JPEG q=0.9.
        const compressed = await compressImage(file, {
          maxWidth: 2048,
          quality: 0.9,
        });
        const dataUrl = `data:${compressed.mimeType};base64,${compressed.base64}`;
        setPreviewUrl(dataUrl);

        const onboardingContext = {
          user_name: snapshot.user_name,
          primary_goal: snapshot.primary_goal,
          skin_type_self_reported: snapshot.skin_type,
          location: snapshot.lifestyle.location,
          weather_context:
            snapshot.lifestyle.uv_index !== null
              ? {
                  uv_index: snapshot.lifestyle.uv_index,
                  humidity: snapshot.lifestyle.humidity ?? 0,
                }
              : null,
          habits: {
            water:
              snapshot.lifestyle.water_liters >= 1.5 ? "normal" : "low",
            sleep:
              snapshot.lifestyle.sleep_hours >= 7 ? "enough" : "late",
            water_liters: snapshot.lifestyle.water_liters,
            sleep_hours: snapshot.lifestyle.sleep_hours,
          },
        };

        const res = await fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: {
              mimeType: compressed.mimeType,
              data: compressed.base64,
            },
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
              : "Mika không đọc được ảnh, thử lại nha.";
          throw new Error(msg);
        }

        // Hold the labor-illusion long enough for at least one phrase sweep.
        const elapsed = Date.now() - start;
        if (elapsed < MIN_ANALYZING_MS) {
          await new Promise((r) => setTimeout(r, MIN_ANALYZING_MS - elapsed));
        }

        setAnalysisResult(payload as AnalysisResult);
      } catch (e) {
        setAnalysisError(
          e instanceof Error
            ? e.message
            : "Có lỗi xảy ra trong quá trình phân tích."
        );
      } finally {
        setAnalysisLoading(false);
      }
    },
    []
  );

  const handleCapture = useCallback(
    (file: File) => {
      const snapshot = data;
      submitOnboarding(snapshot);
      setStepIndex(STEP_KEYS.indexOf("review"));
      void runAnalysis(file, snapshot);
    },
    [data, submitOnboarding, runAnalysis]
  );

  const restartScan = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisLoading(false);
    setPreviewUrl(null);
    setStepIndex(STEP_KEYS.indexOf("photo"));
  }, []);

  const canBack = stepIndex > 0 && !analysisLoading;

  return (
    <div className="onboarding-shell relative flex min-h-dvh flex-col">
      <MeshGradient />

      {/* App-shell: centered phone-width column on desktop, full-bleed on */}
      {/* mobile. Mesh gradient stays full-screen behind it. */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <header
          className="sticky z-30 px-5 pt-3 pb-2 sm:px-6"
          style={{ top: "env(safe-area-inset-top)" }}
        >
          <ProgressPillBar
            current={stepIndex}
            total={STEP_KEYS.length}
            canBack={canBack}
            onBack={back}
          />
        </header>

        <main
          className="flex flex-1 flex-col px-5 pt-4 sm:px-6"
          style={{
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.99 }}
            transition={PAGE_TRANSITION}
            className="flex flex-1 flex-col"
          >
            {stepKey === "goal" && (
              <StepGoal
                value={data.primary_goal}
                onChange={(id) =>
                  setData((d) => ({ ...d, primary_goal: id }))
                }
                onNext={next}
              />
            )}
            {stepKey === "name" && (
              <StepName
                value={data.user_name}
                onChange={(name) =>
                  setData((d) => ({ ...d, user_name: name }))
                }
                onNext={next}
              />
            )}
            {stepKey === "skin" && (
              <StepSkinType
                value={data.skin_type}
                onChange={(id) => setData((d) => ({ ...d, skin_type: id }))}
                onNext={next}
              />
            )}
            {stepKey === "lifestyle" && (
              <StepLifestyle
                value={data.lifestyle}
                onChange={(lifestyle) =>
                  setData((d) => ({ ...d, lifestyle }))
                }
                onNext={next}
              />
            )}
            {stepKey === "photo" && (
              <StepPhotoScan onCapture={handleCapture} />
            )}
            {stepKey === "review" && (
              <StepReview
                loading={analysisLoading}
                error={analysisError}
                result={analysisResult}
                userName={data.user_name}
                primaryGoal={data.primary_goal}
                location={data.lifestyle.location}
                sleepHours={data.lifestyle.sleep_hours}
                waterLiters={data.lifestyle.water_liters}
                previewUrl={previewUrl}
                onRetry={restartScan}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
