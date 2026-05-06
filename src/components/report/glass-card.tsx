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
    background: tint ?? "rgba(255,255,255,0.55)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.40)",
    boxShadow:
      "0 14px 40px rgba(31,38,135,0.12), inset 0 1px 0 rgba(255,255,255,0.50)",
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
