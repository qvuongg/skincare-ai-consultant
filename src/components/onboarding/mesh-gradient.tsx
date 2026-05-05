"use client";

import { motion } from "framer-motion";

import { useLowPower } from "@/lib/hooks/use-low-power";

const BASE_GRADIENT =
  "linear-gradient(180deg, #fbf7ff 0%, #f3f7ff 60%, #f0fbf6 100%)";

// Force a compositor layer + hardware acceleration on every animated blob.
// `transform: translateZ(0)` promotes to its own GPU layer, `willChange`
// signals the browser to keep it there for the duration of the animation.
const GPU_HINT = {
  transform: "translateZ(0)",
  willChange: "transform",
} as const;

export function MeshGradient() {
  const { reduced, isMobile } = useLowPower();

  // Reduced-motion or low-power: render the flat base gradient only. No
  // blurred blobs, no infinite animations — keeps the brand color story
  // while costing essentially zero per frame.
  if (reduced) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: BASE_GRADIENT }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: BASE_GRADIENT }}
    >
      <motion.div
        className="absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full blur-2xl"
        style={{
          ...GPU_HINT,
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 182, 193, 0.78), rgba(255,182,193,0) 60%)",
        }}
        animate={{ x: ["-4%", "8%", "-4%"], y: ["-3%", "6%", "-3%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[5%] h-[55vmax] w-[55vmax] rounded-full blur-2xl"
        style={{
          ...GPU_HINT,
          background:
            "radial-gradient(circle at 60% 40%, rgba(173, 216, 230, 0.88), rgba(173,216,230,0) 60%)",
        }}
        animate={{ x: ["3%", "-7%", "3%"], y: ["4%", "-4%", "4%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Mobile keeps just the two anchor blobs above — desktop adds two */}
      {/* secondary blobs for the richer mesh look. */}
      {!isMobile && (
        <>
          <motion.div
            className="absolute -bottom-[20%] left-[20%] h-[55vmax] w-[55vmax] rounded-full blur-2xl"
            style={{
              ...GPU_HINT,
              background:
                "radial-gradient(circle at 50% 50%, rgba(167, 243, 208, 0.72), rgba(167,243,208,0) 60%)",
            }}
            animate={{ x: ["-2%", "6%", "-2%"], y: ["2%", "-5%", "2%"] }}
            transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[15%] -top-[10%] h-[42vmax] w-[42vmax] rounded-full blur-2xl"
            style={{
              ...GPU_HINT,
              background:
                "radial-gradient(circle at 50% 50%, rgba(216, 191, 255, 0.62), rgba(216,191,255,0) 60%)",
            }}
            animate={{ x: ["2%", "-6%", "2%"], y: ["-2%", "4%", "-2%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(255,255,255,0.25) 100%)",
        }}
      />
    </div>
  );
}
