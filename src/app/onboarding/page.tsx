"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalCard, type GoalTone } from "@/components/onboarding/goal-card";
import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import {
  StepSidebar,
  StepSidebarMobile,
} from "@/components/onboarding/step-sidebar";

const STEP_KEYS = ["goal", "skin", "lifestyle", "scan", "review"] as const;
type StepKey = (typeof STEP_KEYS)[number];

type GoalDef = {
  id: string;
  tone: GoalTone;
  tagline: string;
  title: string;
  description: string;
  icon: typeof Zap;
};

const GOALS: GoalDef[] = [
  {
    id: "clear_acne",
    tone: "purple",
    tagline: "Clarity Protocol",
    title: "Clear Acne",
    description:
      "Calm active breakouts, fade post-acne marks, and restore an even surface.",
    icon: Zap,
  },
  {
    id: "anti_aging",
    tone: "blue",
    tagline: "Longevity Ritual",
    title: "Anti-Aging",
    description:
      "Soften fine lines, support collagen, and rebuild firmness over time.",
    icon: ShieldCheck,
  },
  {
    id: "hydration",
    tone: "green",
    tagline: "Moisture Lock",
    title: "Deep Hydration",
    description:
      "Replenish the moisture barrier and restore that healthy, dewy bounce.",
    icon: Droplets,
  },
];

const GLASS_PANEL: React.CSSProperties = {
  borderRadius: "2rem",
  background: "rgba(255, 255, 255, 0.40)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.55)",
  boxShadow:
    "0 24px 80px rgba(31, 38, 135, 0.12), inset 0 1px 0 rgba(255,255,255,0.75)",
};

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [goalId, setGoalId] = useState<string | null>(null);

  const stepKey: StepKey = STEP_KEYS[stepIndex];
  const goNext = () =>
    setStepIndex((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  const goBack = () => setStepIndex((s) => Math.max(s - 1, 0));

  return (
    <div className="relative min-h-dvh">
      <MeshGradient />

      <main className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-6 lg:px-10 lg:py-10">
        <StepSidebarMobile current={stepIndex} />
        <StepSidebar current={stepIndex} />

        <section
          className="relative z-10 flex flex-1 flex-col overflow-hidden p-6 sm:p-8 lg:p-12"
          style={GLASS_PANEL}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />

          <AnimatePresence mode="wait">
            {stepKey === "goal" ? (
              <motion.div
                key="goal-step"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col"
              >
                <header className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/65 backdrop-blur">
                      <span className="size-1.5 rounded-full bg-foreground/70" />
                      Step 01 · Goal
                    </span>
                  </div>
                  <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-[34px] sm:leading-[1.1]">
                    What&apos;s the result you&apos;d like to see first?
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-foreground/65 sm:text-[15px]">
                    Pick the outcome that would change how you feel about your
                    skin today. We&apos;ll tune every recommendation around it.
                  </p>
                </header>

                <div className="relative mt-8 flex flex-1 flex-col gap-4 sm:gap-5">
                  {GOALS.map((g, idx) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.08 + idx * 0.08,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ zIndex: GOALS.length - idx }}
                    >
                      <GoalCard
                        tone={g.tone}
                        tagline={g.tagline}
                        title={g.title}
                        description={g.description}
                        icon={g.icon}
                        selected={goalId === g.id}
                        onSelect={() => setGoalId(g.id)}
                      />
                    </motion.div>
                  ))}
                </div>

                <footer className="mt-10 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-foreground/50">
                    You can refine your goal later in your dashboard.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="lg"
                      variant="ghost"
                      disabled
                      className="rounded-full"
                    >
                      <ArrowLeft className="size-4" /> Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={goNext}
                      disabled={!goalId}
                      className="rounded-full bg-foreground text-background hover:bg-foreground/85"
                    >
                      Continue <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </footer>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder-step"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                  Step {String(stepIndex + 1).padStart(2, "0")}
                </span>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                  Coming up next
                </h2>
                <p className="max-w-sm text-sm text-foreground/60">
                  This step is being designed. Step 1 — Goal — is the focus of
                  this build.
                </p>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={goBack}
                  className="mt-2 rounded-full"
                >
                  <ArrowLeft className="size-4" /> Back to goal
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
