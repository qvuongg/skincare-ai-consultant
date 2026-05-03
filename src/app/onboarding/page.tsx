"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { ProgressPillBar } from "@/components/onboarding/progress-pill-bar";
import { StepAge, type AgeRangeId } from "@/components/onboarding/step-age";
import { StepBudget } from "@/components/onboarding/step-budget";
import { StepDiet, type DietOptionId } from "@/components/onboarding/step-diet";
import {
  StepEnvironment,
  type EnvironmentId,
} from "@/components/onboarding/step-environment";
import { GOAL_LABELS, StepGoal } from "@/components/onboarding/step-goal";
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
  "diet",
  "environment",
  "budget",
  "age",
  "name",
  "skin",
  "lifestyle",
  "photo",
  "review",
] as const;
type StepKey = (typeof STEP_KEYS)[number];

const MIN_ANALYZING_MS = 4000;

type FormData = {
  primary_goals: string[];
  diet: DietOptionId[];
  environment: EnvironmentId | null;
  environment_other: string;
  budget_vnd: number;
  age_range: AgeRangeId | null;
  user_name: string;
  skin_type: string | null;
  lifestyle: LifestyleData;
};

const INITIAL: FormData = {
  primary_goals: [],
  diet: [],
  environment: null,
  environment_other: "",
  budget_vnd: 500_000,
  age_range: null,
  user_name: "",
  skin_type: null,
  lifestyle: {
    location: null,
    uv_index: null,
    humidity: null,
    water_liters: 1.5,
    sleep_hours: 7,
    exercise_sessions: 3,
  },
};

// Joins selected goal IDs into a human-readable string for legacy consumers
// (Supabase `primary_goal` column, leads admin export, Gemini prompt). Falls
// back to the raw ID when no label mapping exists.
function joinGoalLabels(ids: string[]): string {
  if (ids.length === 0) return "";
  return ids.map((id) => GOAL_LABELS[id] ?? id).join(", ");
}

// iOS 26 "elastic bounce" — a stiff spring with low damping.
const PAGE_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

// Direction-aware slide variants. `custom` carries +1 (forward) or -1 (back),
// so the next page slides in from the right when navigating forward and from
// the left when navigating back — mirrors iOS push/pop motion.
const PAGE_VARIANTS = {
  enter: (d: 1 | -1) => ({
    opacity: 0,
    x: d === 1 ? 32 : -32,
    scale: 0.985,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (d: 1 | -1) => ({
    opacity: 0,
    x: d === 1 ? -24 : 24,
    scale: 0.99,
  }),
};

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stepKey: StepKey = STEP_KEYS[stepIndex];
  const next = useCallback(() => {
    setDirection(1);
    setStepIndex((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  }, []);
  const back = useCallback(() => {
    setDirection(-1);
    setStepIndex((s) => Math.max(s - 1, 0));
  }, []);

  const submitOnboarding = useCallback((d: FormData) => {
    const goalLabel = joinGoalLabels(d.primary_goals);
    const payload = {
      user_name: d.user_name,
      name: d.user_name,
      primary_goal: goalLabel || "Chưa chọn",
      primary_goals: d.primary_goals,
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
        exercise_sessions: d.lifestyle.exercise_sessions,
        diet: d.diet,
        environment: d.environment,
        environment_other: d.environment_other,
        budget_vnd: d.budget_vnd,
        age_range: d.age_range,
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
          primary_goal: joinGoalLabels(snapshot.primary_goals) || null,
          primary_goals: snapshot.primary_goals,
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
            exercise_sessions: snapshot.lifestyle.exercise_sessions,
            diet: snapshot.diet,
            environment: snapshot.environment,
            environment_other: snapshot.environment_other,
            budget_vnd: snapshot.budget_vnd,
            age_range: snapshot.age_range,
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
      setDirection(1);
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
    setDirection(-1);
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
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={PAGE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={PAGE_TRANSITION}
              className="flex flex-1 flex-col"
            >
              {stepKey === "goal" && (
                <StepGoal
                  value={data.primary_goals}
                  onChange={(goals) =>
                    setData((d) => ({ ...d, primary_goals: goals }))
                  }
                  onNext={next}
                />
              )}
              {stepKey === "diet" && (
                <StepDiet
                  value={data.diet}
                  onChange={(diet) => setData((d) => ({ ...d, diet }))}
                  onNext={next}
                />
              )}
              {stepKey === "environment" && (
                <StepEnvironment
                  value={data.environment}
                  otherDescription={data.environment_other}
                  onChange={(env) =>
                    setData((d) => ({ ...d, environment: env }))
                  }
                  onOtherDescriptionChange={(desc) =>
                    setData((d) => ({ ...d, environment_other: desc }))
                  }
                  onNext={next}
                />
              )}
              {stepKey === "budget" && (
                <StepBudget
                  value={data.budget_vnd}
                  onChange={(v) => setData((d) => ({ ...d, budget_vnd: v }))}
                  onNext={next}
                />
              )}
              {stepKey === "age" && (
                <StepAge
                  value={data.age_range}
                  onChange={(age) =>
                    setData((d) => ({ ...d, age_range: age }))
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
                  primaryGoal={data.primary_goals[0] ?? null}
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
