import type { Transition, Variants } from "framer-motion";

// Apple Showcase 2026 spring — soft + slightly bouncy. Shared across every
// interactive surface on the landing page so all motion feels like the same
// physical system.
export const SPRING: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

// GPU hint applied to every animated glass surface so blur + transform
// composite on the GPU instead of repainting on the CPU each frame.
export const GPU = {
  willChange: "transform, opacity",
  transform: "translateZ(0)",
} as const;

// Standard scroll-reveal: fades up 36px into place. Use with whileInView for
// below-the-fold sections so they only animate when actually visible.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

// Stagger container — wrap fadeUp children to make them cascade in.
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// Shared glass-surface base for premium cards. Spread into a `style` prop.
export const GLASS = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow:
    "0 24px 60px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.85)",
} as const;

// Lighter glass for chips/pills/eyebrow tags.
export const GLASS_LIGHT = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
} as const;
