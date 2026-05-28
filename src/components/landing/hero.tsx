"use client";

import { motion } from "framer-motion";
import { Layers, ScanFace, Sparkles, Timer } from "lucide-react";

import { FaceScanVisualizer } from "./face-scan-visualizer";
import { IrisCta } from "./iris-cta";
import { GLASS_LIGHT, GPU, SPRING, fadeUp, stagger } from "./landing-tokens";

// Hero now anchors on the FaceScanVisualizer (right column) instead of the
// previous 3 floating value cards. The old value props were repeating things
// the lower sections already prove — the face scanner does the heavy visual
// lift here, while the left column carries the message + primary CTA.

const STAT_CHIPS = [
  { icon: ScanFace, value: "468", label: "điểm mốc khuôn mặt" },
  { icon: Layers, value: "11", label: "chỉ số da đo lường" },
  { icon: Timer, value: "60s", label: "mỗi lượt quét" },
];

export function Hero({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  return (
    <section className="relative px-6 pt-12 pb-16 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-7"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70"
              style={{
                ...GLASS_LIGHT,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.85), 0 6px 20px rgba(168,85,247,0.10)",
              }}
            >
              <Sparkles
                className="size-3.5 text-purple-600"
                strokeWidth={2.6}
              />
              Kỷ nguyên soi da công nghệ mới
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-balance text-[40px] font-semibold leading-[1.02] tracking-tight sm:text-[52px] lg:text-[68px]"
              style={{
                filter: "drop-shadow(0 14px 40px rgba(31,38,135,0.10))",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(180deg, #1f2937 0%, #4b5563 50%, #111827 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Làn da đẹp không chỉ là may mắn.{" "}
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Đó là khoa học.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-[44ch] text-pretty text-[16px] leading-relaxed text-foreground/65 sm:text-[17px]"
            >
              AI bắt 468 điểm mốc khuôn mặt, chấm điểm 11 chỉ số da và thiết
              kế Routine cá nhân hóa — đúng độ tuổi, đúng ngân sách, đúng UV
              Đà Nẵng hôm nay.
            </motion.p>

            <motion.div variants={fadeUp}>
              <IrisCta
                label="Bắt đầu hành trình soi da"
                onClick={onCta}
                reduced={reduced}
              />
            </motion.div>

            {/* Stat chips — 3 quick numerical proofs under the CTA */}
            <motion.ul
              variants={fadeUp}
              className="mt-2 flex flex-wrap gap-2"
            >
              {STAT_CHIPS.map((s) => (
                <StatChip key={s.label} {...s} />
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.2 }}
            style={GPU}
          >
            <FaceScanVisualizer reduced={reduced} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof ScanFace;
  value: string;
  label: string;
}) {
  return (
    <li
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
      style={GLASS_LIGHT}
    >
      <Icon className="size-3.5 text-purple-600" strokeWidth={2.6} />
      <span className="text-[13px] font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-[11.5px] font-medium text-foreground/60">
        {label}
      </span>
    </li>
  );
}
