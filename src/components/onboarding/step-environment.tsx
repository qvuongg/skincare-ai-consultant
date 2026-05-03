"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Factory,
  Laptop,
  MoreHorizontal,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type EnvironmentId = "office" | "factory" | "outdoor" | "other";

type EnvOption = {
  id: EnvironmentId;
  emoji: string;
  title: string;
  vibe: string;
  icon: LucideIcon;
  tint: string;
  glow: string;
};

const ENV_OPTIONS: EnvOption[] = [
  {
    id: "office",
    emoji: "💻",
    title: "Văn phòng máy tính",
    vibe: "Máy lạnh + ánh sáng xanh, da dễ khô & thâm xỉn.",
    icon: Laptop,
    tint: "rgba(59, 130, 246, 0.12)",
    glow: "rgba(59, 130, 246, 0.45)",
  },
  {
    id: "factory",
    emoji: "🏭",
    title: "Nhà máy",
    vibe: "Bụi mịn & hóa chất công nghiệp, cần barrier xịn.",
    icon: Factory,
    tint: "rgba(120, 113, 108, 0.16)",
    glow: "rgba(120, 113, 108, 0.5)",
  },
  {
    id: "outdoor",
    emoji: "☀️",
    title: "Ngoài trời",
    vibe: "UV cao mỗi ngày — sunscreen là best friend.",
    icon: Sun,
    tint: "rgba(249, 115, 22, 0.15)",
    glow: "rgba(249, 115, 22, 0.5)",
  },
  {
    id: "other",
    emoji: "✨",
    title: "Khác",
    vibe: "Mô tả nhanh môi trường của bạn nhé.",
    icon: MoreHorizontal,
    tint: "rgba(168, 85, 247, 0.14)",
    glow: "rgba(168, 85, 247, 0.5)",
  },
];

type Props = {
  value: EnvironmentId | null;
  otherDescription: string;
  onChange: (next: EnvironmentId) => void;
  onOtherDescriptionChange: (next: string) => void;
  onNext: () => void;
};

export function StepEnvironment({
  value,
  otherDescription,
  onChange,
  onOtherDescriptionChange,
  onNext,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus the freeform input when the user picks "Khác" — small QoL touch.
  useEffect(() => {
    if (value === "other") {
      // Wait one tick for the input to mount/animate-in before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [value]);

  const canContinue =
    value !== null &&
    (value !== "other" || otherDescription.trim().length > 0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 03 · Workplace
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Môi trường &lsquo;cày cuốc&rsquo; của bạn?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          8 tiếng mỗi ngày bạn ở đâu? Mika cần biết để map đúng kẻ thù của da.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Môi trường làm việc"
        className="mt-6 flex flex-col gap-3"
      >
        {ENV_OPTIONS.map((opt, idx) => {
          const selected = value === opt.id;
          const Icon = opt.icon;
          return (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.05 + idx * 0.06,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 22,
                }}
                className="relative isolate w-full overflow-hidden p-4 text-left focus:outline-none"
                style={{
                  borderRadius: "1.5rem",
                  background: `linear-gradient(135deg, ${opt.tint}, rgba(255,255,255,0.55))`,
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: selected
                    ? `0 22px 48px -12px ${opt.glow}, 0 0 0 2px ${opt.glow}, inset 0 1px 0 rgba(255,255,255,0.85)`
                    : "0 10px 26px rgba(31,38,135,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
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

                <div className="relative z-10 flex items-center gap-3.5">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/65 text-foreground/75"
                    style={{
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    <Icon className="size-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] leading-none" aria-hidden>
                        {opt.emoji}
                      </span>
                      <p className="text-[16px] font-semibold tracking-tight text-foreground">
                        {opt.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-foreground/55">
                      {opt.vibe}
                    </p>
                  </div>
                  <motion.span
                    aria-hidden
                    animate={{
                      scale: selected ? 1 : 0.85,
                      opacity: selected ? 1 : 0.45,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 18,
                    }}
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/65"
                    style={{
                      background: selected
                        ? "rgb(15, 23, 42)"
                        : "rgba(255,255,255,0.55)",
                      boxShadow: selected
                        ? `0 6px 16px ${opt.glow}`
                        : "inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    {selected && (
                      <span className="size-2 rounded-full bg-white" />
                    )}
                  </motion.span>
                </div>
              </motion.button>
            </motion.div>
          );
        })}

        <AnimatePresence initial={false}>
          {value === "other" && (
            <motion.div
              key="other-input"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
              }}
              className="overflow-hidden"
            >
              <div
                className="mt-1 flex items-center gap-3 px-4"
                style={{
                  borderRadius: "1.25rem",
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.65)",
                  boxShadow:
                    "0 10px 28px rgba(31,38,135,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
              >
                <span className="text-[14px]" aria-hidden>
                  ✏️
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  enterKeyHint="done"
                  placeholder="Vd: Quán cafe, công trường, bếp nhà hàng…"
                  value={otherDescription}
                  onChange={(e) => onOtherDescriptionChange(e.target.value)}
                  maxLength={60}
                  className="h-12 flex-1 bg-transparent text-[15px] font-medium tracking-tight text-foreground placeholder:font-normal placeholder:text-foreground/35 focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-5 text-[11px] leading-snug text-foreground/45">
        🔒 Insider · Thông tin này giúp Mika tính toán lượng UV và ô nhiễm bạn
        phải tiếp xúc mỗi ngày.
      </p>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
