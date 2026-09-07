"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/**
 * Liquid Glass surface — SPEC §2.1.
 *
 *   • Translucency  · backdrop-filter blur(24px) saturate(180%)
 *   • Soft Light    · inset 1px highlight + outer soft shadow
 *   • Adaptive Tint · caller passes `tint` (rgba/color-mix) to vary the
 *                     surface color per band/sentiment without touching
 *                     the rest of the styles.
 *
 * This is a *dumb* surface — it doesn't run an entry animation. Wrap it
 * in `motion.div` at the call site if you want stagger / spring-in,
 * because the right entry varies (hero springs in, list cards stagger).
 */
type Props = HTMLAttributes<HTMLDivElement> & {
  /** Background tint. Defaults to neutral 55% white. */
  tint?: string;
};

export function GlassCard({
  className = "",
  tint,
  style,
  children,
  ...rest
}: Props): ReactNode {
  const surface: CSSProperties = {
    background: tint ?? "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(28px) saturate(190%)",
    WebkitBackdropFilter: "blur(28px) saturate(190%)",
    border: "1px solid rgba(255, 255, 255, 0.75)",
    boxShadow:
      "0 16px 36px rgba(31, 38, 135, 0.07), 0 2px 8px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
    ...style,
  };
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${className}`}
      style={surface}
      {...rest}
    >
      {children}
    </div>
  );
}
