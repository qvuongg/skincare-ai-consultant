"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type GoalTone = "purple" | "blue" | "green";

type ToneTokens = {
  tint: string;
  ringSelected: string;
  iconBg: string;
  iconFg: string;
  titleColor: string;
  glow: string;
};

const TONE_TOKENS: Record<GoalTone, ToneTokens> = {
  purple: {
    tint: "rgba(168, 85, 247, 0.10)",
    ringSelected: "rgba(168, 85, 247, 0.55)",
    iconBg: "rgba(168, 85, 247, 0.16)",
    iconFg: "rgb(126, 34, 206)",
    titleColor: "rgb(76, 29, 149)",
    glow: "rgba(168, 85, 247, 0.40)",
  },
  blue: {
    tint: "rgba(59, 130, 246, 0.10)",
    ringSelected: "rgba(59, 130, 246, 0.55)",
    iconBg: "rgba(59, 130, 246, 0.16)",
    iconFg: "rgb(29, 78, 216)",
    titleColor: "rgb(30, 58, 138)",
    glow: "rgba(59, 130, 246, 0.40)",
  },
  green: {
    tint: "rgba(34, 197, 94, 0.10)",
    ringSelected: "rgba(34, 197, 94, 0.55)",
    iconBg: "rgba(34, 197, 94, 0.16)",
    iconFg: "rgb(21, 128, 61)",
    titleColor: "rgb(20, 83, 45)",
    glow: "rgba(34, 197, 94, 0.40)",
  },
};

type GoalCardProps = {
  tagline: string;
  title: string;
  description: string;
  tone: GoalTone;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
};

export function GoalCard({
  tagline,
  title,
  description,
  tone,
  icon: Icon,
  selected,
  onSelect,
}: GoalCardProps) {
  const tokens = TONE_TOKENS[tone];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileHover={{ scale: 1.012, y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 16, mass: 0.8 }}
      className="group/card relative w-full text-left focus:outline-none"
      style={{ borderRadius: "2rem" }}
    >
      <motion.div
        animate={{
          boxShadow: selected
            ? `0 28px 60px -10px ${tokens.glow}, 0 0 0 2px ${tokens.ringSelected}, inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.35)`
            : "0 14px 40px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(255,255,255,0.25)",
        }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="relative isolate overflow-hidden p-5 sm:p-6"
        style={{
          borderRadius: "2rem",
          background: `linear-gradient(135deg, ${tokens.tint} 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.35) 100%)`,
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-8 left-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.7), transparent)",
          }}
        />

        <motion.span
          aria-hidden
          initial={false}
          animate={{
            opacity: selected ? 1 : 0,
            x: selected ? 0 : 60,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute -top-1/3 right-[-15%] h-[220%] w-[55%] rotate-[18deg]"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
            filter: "blur(10px)",
          }}
        />

        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: selected ? 0.6 : 0 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "2rem",
            background: `radial-gradient(circle at 80% 20%, ${tokens.glow}, transparent 55%)`,
          }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <motion.span
            animate={{ rotate: selected ? -6 : 0, scale: selected ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 14 }}
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:size-14"
            style={{
              background: tokens.iconBg,
              color: tokens.iconFg,
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            <Icon className="size-[22px] sm:size-6" strokeWidth={2.2} />
          </motion.span>

          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: tokens.iconFg, opacity: 0.85 }}
            >
              {tagline}
            </p>
            <h3
              className="mt-1 text-[18px] font-semibold tracking-tight sm:text-[22px]"
              style={{ color: tokens.titleColor }}
            >
              {title}
            </h3>
            <p className="mt-1 text-[13px] leading-snug text-foreground/65 sm:text-sm">
              {description}
            </p>
          </div>

          <motion.span
            aria-hidden
            animate={{
              x: selected ? 4 : 0,
              opacity: selected ? 1 : 0.5,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/65"
            style={{
              background: selected ? tokens.iconFg : "rgba(255,255,255,0.55)",
              color: selected ? "white" : tokens.iconFg,
              boxShadow: selected
                ? `0 8px 20px ${tokens.glow}`
                : "0 4px 12px rgba(31,38,135,0.08)",
            }}
          >
            <ArrowRight className="size-4" />
          </motion.span>
        </div>
      </motion.div>
    </motion.button>
  );
}
