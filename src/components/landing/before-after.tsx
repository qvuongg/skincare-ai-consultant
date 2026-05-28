"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

// Before/after slider — drag the vertical handle to reveal week-4 progress
// over week-0 baseline. CSS-gradient skin textures act as placeholder until
// real before/after photos are wired in.
//
// `beforeSrc` / `afterSrc` are slots — when real images arrive, drop them
// into the corresponding panels and they overlay/replace the CSS texture.

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
};

const STATS = [
  {
    icon: TrendingDown,
    label: "Mụn viêm",
    from: 64,
    to: 28,
    color: "#dc2626",
  },
  {
    icon: TrendingUp,
    label: "Độ ẩm",
    from: 32,
    to: 71,
    color: "#3b82f6",
  },
  {
    icon: TrendingDown,
    label: "Đỏ da",
    from: 58,
    to: 24,
    color: "#e11d48",
  },
];

// CSS textures — same vocabulary as SkinMacro but tuned for full-bleed.
const BEFORE_BG = [
  "radial-gradient(circle at 22% 28%, rgba(190,18,60,0.55), transparent 7%)",
  "radial-gradient(circle at 38% 55%, rgba(220,38,38,0.55), transparent 6%)",
  "radial-gradient(circle at 70% 35%, rgba(190,18,60,0.50), transparent 7%)",
  "radial-gradient(circle at 55% 75%, rgba(220,38,38,0.50), transparent 7%)",
  "radial-gradient(circle at 28% 78%, rgba(190,18,60,0.45), transparent 6%)",
  "radial-gradient(circle at 80% 65%, rgba(220,38,38,0.40), transparent 6%)",
  "radial-gradient(circle at 50% 30%, rgba(180,100,80,0.30), transparent 25%)",
  "linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)",
].join(", ");

const AFTER_BG = [
  "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.65), transparent 30%)",
  "radial-gradient(circle at 65% 55%, rgba(255,255,255,0.50), transparent 35%)",
  "radial-gradient(circle at 50% 70%, rgba(255,235,210,0.45), transparent 40%)",
  "radial-gradient(circle at 25% 75%, rgba(255,245,225,0.40), transparent 35%)",
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fed7aa 100%)",
].join(", ");

export function BeforeAfter({ beforeSrc, afterSrc }: Props = {}) {
  const [position, setPosition] = useState(50);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromPointer = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setPosition(ratio * 100);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  return (
    <section className="px-6 py-20 lg:py-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-7xl"
      >
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
            style={GLASS_LIGHT}
          >
            <Calendar className="size-3 text-emerald-600" strokeWidth={2.6} />
            Tiến trình có thật
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Sau 4 tuần.{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Cùng một khuôn mặt.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
            Đo lường khách quan = tiến trình rõ ràng. Mika overlay scan tuần 0
            với scan tuần 4, cho bạn thấy chính xác chỉ số nào đang cải thiện.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14"
        >
          {/* Slider */}
          <div
            className="relative overflow-hidden rounded-[2rem] p-3"
            style={{ ...GLASS, ...GPU }}
          >
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              role="slider"
              aria-label="So sánh tuần 0 và tuần 4"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight")
                  setPosition((p) => Math.min(100, p + 5));
                if (e.key === "ArrowLeft")
                  setPosition((p) => Math.max(0, p - 5));
              }}
              className="relative aspect-[16/10] cursor-ew-resize touch-none select-none overflow-hidden rounded-[1.5rem]"
            >
              {/* BEFORE — full layer */}
              <div
                className="absolute inset-0"
                style={{
                  background: BEFORE_BG,
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.30), inset 0 12px 32px rgba(0,0,0,0.08)",
                }}
              >
                {beforeSrc && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={beforeSrc}
                    alt="Tuần 0 baseline"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>

              {/* AFTER — clipped by handle position */}
              <div
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 0 0 ${position}%)`,
                  WebkitClipPath: `inset(0 0 0 ${position}%)`,
                  background: AFTER_BG,
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.30), inset 0 12px 32px rgba(0,0,0,0.08)",
                  transition: "clip-path 0.04s linear",
                }}
              >
                {afterSrc && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={afterSrc}
                    alt="Tuần 4 sau routine Mika"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Corner labels */}
              <span
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-white"
                style={{
                  background: "rgba(15,23,42,0.75)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="size-1 rounded-full bg-rose-400" />
                Tuần 0
              </span>
              <span
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-white"
                style={{
                  background: "rgba(15,23,42,0.75)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="size-1 rounded-full bg-emerald-400" />
                Tuần 4
              </span>

              {/* Handle line + grip */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px"
                style={{
                  left: `${position}%`,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
                  boxShadow: "0 0 16px rgba(255,255,255,0.55)",
                }}
              />
              <div
                className="pointer-events-none absolute top-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{
                  left: `${position}%`,
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M4 3L1 7L4 11"
                    stroke="#475569"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 3L13 7L10 11"
                    stroke="#475569"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-3 px-2 text-center text-[11.5px] font-medium text-foreground/55">
              Kéo thanh để so sánh · Bấm phím ← → để di chuyển nhỏ
            </p>
          </div>

          {/* Stat cards */}
          <ul className="space-y-3">
            {STATS.map((s) => (
              <StatRow key={s.label} stat={s} />
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatRow({
  stat,
}: {
  stat: {
    icon: typeof TrendingUp;
    label: string;
    from: number;
    to: number;
    color: string;
  };
}) {
  const Icon = stat.icon;
  const isUp = stat.icon === TrendingUp;
  const delta = isUp ? stat.to - stat.from : stat.from - stat.to;
  return (
    <motion.li
      variants={fadeUp}
      className="relative flex items-center gap-4 rounded-2xl p-4 sm:p-5"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center"
        style={{
          background: `${stat.color}14`,
          borderRadius: "12px",
          border: `1px solid ${stat.color}33`,
        }}
      >
        <Icon
          className="size-5"
          strokeWidth={2.4}
          style={{ color: stat.color }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-tight text-foreground/85">
          {stat.label}
        </p>
        <div className="mt-1 flex items-baseline gap-2 text-[13px] tabular-nums">
          <span className="text-foreground/45 line-through">{stat.from}</span>
          <span className="text-foreground/30">→</span>
          <span
            className="text-[20px] font-bold tracking-tight"
            style={{ color: stat.color }}
          >
            {stat.to}
          </span>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{
              background: `${stat.color}14`,
              color: stat.color,
              border: `1px solid ${stat.color}33`,
            }}
          >
            {isUp ? "+" : "-"}
            {delta}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
