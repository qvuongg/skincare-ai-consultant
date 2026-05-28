"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ScanFace } from "lucide-react";

import { GPU, SPRING } from "./landing-tokens";

// Bottom-anchored quick-action CTA that only appears on mobile and only
// after the user has scrolled past the hero. Fades back out before they
// hit the final CTA so the two don't stack visually.
export function StickyMobileCta({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  const { scrollY } = useScroll();
  // Fade in between 500–700px scrolled; fade out as the page-end approaches
  // so it doesn't double up with FinalCta + Footer.
  const opacity = useTransform(scrollY, [500, 700], [0, 1]);
  const yOff = useTransform(scrollY, [500, 700], [40, 0]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 lg:hidden"
      style={{
        opacity,
        y: yOff,
        paddingBottom: "max(0.85rem, env(safe-area-inset-bottom))",
      }}
    >
      <motion.button
        type="button"
        onClick={onCta}
        whileTap={{ scale: 0.96 }}
        whileHover={reduced ? undefined : { scale: 1.02 }}
        transition={SPRING}
        className="pointer-events-auto relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3.5 text-[15px] font-semibold text-white"
        style={{
          background:
            "linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
          border: "1px solid rgba(255,255,255,0.45)",
          boxShadow:
            "0 18px 44px rgba(168,85,247,0.40), inset 0 1px 0 rgba(255,255,255,0.55)",
          ...GPU,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
          }}
        />
        <ScanFace className="size-4" strokeWidth={2.6} />
        Quét da ngay
      </motion.button>
    </motion.div>
  );
}
