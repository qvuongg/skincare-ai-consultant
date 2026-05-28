"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { GLASS, GPU, SPRING } from "./landing-tokens";

export type ValueProp = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  iconBg: string;
  glow: string;
};

// Floating glass card used by Hero. Spread the GLASS token + hover lift.
// The squircle icon uses a 14px corner radius (Apple's ~30% rule on 48px).
export function ValueCard({
  prop,
  reduced,
}: {
  prop: ValueProp;
  reduced: boolean;
}) {
  const Icon = prop.icon;
  return (
    <motion.article
      whileHover={
        reduced
          ? undefined
          : {
              y: -4,
              scale: 1.015,
              transition: { ...SPRING, stiffness: 220 },
            }
      }
      className="relative flex flex-col gap-4 rounded-3xl p-6"
      style={{
        ...GLASS,
        ...GPU,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      <span
        className="flex size-12 shrink-0 items-center justify-center text-white"
        style={{
          background: prop.iconBg,
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: `0 12px 28px ${prop.glow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
        }}
      >
        <Icon className="size-5" strokeWidth={2.4} />
      </span>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          {prop.eyebrow}
        </p>
        <h3 className="text-[18px] font-semibold tracking-tight text-foreground">
          {prop.title}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-foreground/65">
          {prop.body}
        </p>
      </div>
    </motion.article>
  );
}
