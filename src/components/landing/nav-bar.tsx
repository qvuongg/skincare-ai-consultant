"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { GPU, SPRING } from "./landing-tokens";

// Sticky glass strip at the top of the page. Squircle logo with a slow
// rotate+scale sparkle pulse on the left; filled-gradient pill CTA with a
// horizontal shimmer sweep on the right.
export function NavBar({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-50 h-16 w-full"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.45)",
        boxShadow:
          "inset 0 -1px 0 rgba(255,255,255,0.4), 0 4px 24px rgba(31,38,135,0.06)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <motion.span
            aria-hidden
            className="relative flex size-9 items-center justify-center text-white"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow:
                "0 8px 20px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.7)",
              ...GPU,
            }}
            animate={
              reduced
                ? undefined
                : { rotate: [0, 8, -5, 0], scale: [1, 1.05, 0.97, 1] }
            }
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="size-5" strokeWidth={2.4} />
          </motion.span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Mika Casa
          </span>
        </div>

        <ShimmerPill label="Soi da · 60s" onClick={onCta} reduced={reduced} />
      </div>
    </header>
  );
}

// Filled-gradient pill (refreshed from earlier glass-white version — that
// one read too pale against the mesh background). Horizontal shimmer sweeps
// across periodically.
function ShimmerPill({
  label,
  onClick,
  reduced,
}: {
  label: string;
  onClick: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduced ? undefined : { scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      transition={SPRING}
      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-4 py-2 text-[13px] font-semibold text-white"
      style={{
        background:
          "linear-gradient(135deg, #a855f7 0%, #3b82f6 60%, #22c55e 100%)",
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow:
          "0 8px 22px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.55)",
        ...GPU,
      }}
    >
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
          }}
          animate={{ x: ["-100%", "220%"] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 1.6,
            ease: "easeInOut",
          }}
        />
      )}
      <span className="relative">{label}</span>
      <ArrowRight className="relative size-3.5" strokeWidth={2.8} />
    </motion.button>
  );
}
