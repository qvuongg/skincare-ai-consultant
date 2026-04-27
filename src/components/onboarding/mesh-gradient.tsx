"use client";

import { motion } from "framer-motion";

export function MeshGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #fbf7ff 0%, #f3f7ff 60%, #f0fbf6 100%)" }}
    >
      <motion.div
        className="absolute -left-[10%] -top-[15%] h-[65vmax] w-[65vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 182, 193, 0.75), rgba(255,182,193,0) 60%)",
        }}
        animate={{ x: ["-4%", "8%", "-4%"], y: ["-3%", "6%", "-3%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[5%] h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(173, 216, 230, 0.85), rgba(173,216,230,0) 60%)",
        }}
        animate={{ x: ["3%", "-7%", "3%"], y: ["4%", "-4%", "4%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[20%] h-[58vmax] w-[58vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(167, 243, 208, 0.7), rgba(167,243,208,0) 60%)",
        }}
        animate={{ x: ["-2%", "6%", "-2%"], y: ["2%", "-5%", "2%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[15%] -top-[10%] h-[45vmax] w-[45vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(216, 191, 255, 0.6), rgba(216,191,255,0) 60%)",
        }}
        animate={{ x: ["2%", "-6%", "2%"], y: ["-2%", "4%", "-2%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
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
