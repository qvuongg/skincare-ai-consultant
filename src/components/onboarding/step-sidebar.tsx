"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Check,
  ClipboardCheck,
  Droplet,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepDef = { id: string; label: string; icon: LucideIcon };

const STEPS: StepDef[] = [
  { id: "goal", label: "Goal", icon: Target },
  { id: "skin", label: "Skin Type", icon: Droplet },
  { id: "lifestyle", label: "Lifestyle", icon: Sparkles },
  { id: "scan", label: "Photo Scan", icon: Camera },
  { id: "review", label: "Review", icon: ClipboardCheck },
];

const GLASS_PANEL: React.CSSProperties = {
  borderRadius: "2rem",
  background: "rgba(255, 255, 255, 0.42)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.55)",
  boxShadow:
    "0 24px 60px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
};

export function StepSidebar({ current }: { current: number }) {
  return (
    <aside
      className="relative z-10 hidden shrink-0 flex-col justify-between p-8 lg:flex lg:w-[280px]"
      style={GLASS_PANEL}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/55">
          Casa Mika
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground/90">
          Skin Journey
        </h1>
        <p className="mt-2 text-xs text-foreground/55">
          A 5-step ritual to learn your skin.
        </p>
      </div>

      <ol className="my-10 space-y-7" aria-label="Onboarding progress">
        {STEPS.map((step, idx) => {
          const isComplete = idx < current;
          const isActive = idx === current;
          const Icon = step.icon;

          return (
            <li key={step.id} className="relative flex h-10 items-center gap-4">
              {idx < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[19px] top-10 h-7 w-px",
                    isComplete ? "bg-foreground/45" : "bg-foreground/15"
                  )}
                />
              )}
              <motion.span
                layout
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  isActive &&
                    "bg-foreground text-background shadow-[0_10px_24px_rgba(15,15,30,0.22)]",
                  isComplete && "bg-foreground/85 text-background",
                  !isActive &&
                    !isComplete &&
                    "border border-foreground/20 bg-white/40 text-foreground/45"
                )}
              >
                {isComplete ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-[18px]" />
                )}
                {isActive && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-2 ring-foreground/15"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </motion.span>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-foreground/40">
                  Step {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tracking-tight transition-colors",
                    isActive
                      ? "text-foreground"
                      : isComplete
                      ? "text-foreground/75"
                      : "text-foreground/40"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className="rounded-2xl border border-white/60 bg-white/45 p-4 text-xs leading-relaxed text-foreground/65"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <p className="font-medium text-foreground/80">Quick tip</p>
        <p className="mt-1">
          Your profile takes ~2 minutes. We never share answers without your
          consent.
        </p>
      </div>
    </aside>
  );
}

export function StepSidebarMobile({ current }: { current: number }) {
  return (
    <nav
      aria-label="Onboarding progress"
      className="relative z-10 flex items-center gap-2 overflow-x-auto p-3 lg:hidden"
      style={GLASS_PANEL}
    >
      {STEPS.map((step, idx) => {
        const isComplete = idx < current;
        const isActive = idx === current;
        const Icon = step.icon;
        return (
          <div
            key={step.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              isActive && "bg-foreground text-background",
              isComplete && "bg-foreground/80 text-background",
              !isActive && !isComplete && "bg-white/55 text-foreground/55"
            )}
          >
            {isComplete ? <Check className="size-3" /> : <Icon className="size-3" />}
            {step.label}
          </div>
        );
      })}
    </nav>
  );
}
