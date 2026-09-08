"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CircleDot,
  Droplet,
  Flame,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
};

// CSS textures — layered radial gradients imitating skin under macro lens.
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

const PRESETS = [
  { label: "Tuần 0 · Khởi đầu", pos: 0, tag: "Baseline" },
  { label: "Tuần 2 · Phục hồi", pos: 50, tag: "Giảm sưng" },
  { label: "Tuần 4 · Rạng rỡ", pos: 100, tag: "Mọng màng" },
];

export function BeforeAfter({ beforeSrc, afterSrc }: Props = {}) {
  const [position, setPosition] = useState(50);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromPointer = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setPosition(Math.round(ratio * 100));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  // Real-time live interpolation across time (Week 0 to Week 4)
  const progressRatio = position / 100;
  const currentMetrics = useMemo(() => {
    const acne = Math.round(64 - progressRatio * (64 - 28));
    const hydration = Math.round(32 + progressRatio * (71 - 32));
    const redness = Math.round(58 - progressRatio * (58 - 24));
    const weekNumber = (progressRatio * 4).toFixed(1);

    let phase = "Tuần 0 · Nền da ban đầu";
    if (progressRatio > 0.8) phase = "Tuần 4 · Tái cấu trúc rạng rỡ";
    else if (progressRatio > 0.4) phase = "Tuần 2 · Viêm lặn rõ & khóa ẩm";
    else if (progressRatio > 0.1) phase = "Tuần 1 · Dịu kích ứng biểu bì";

    return { acne, hydration, redness, weekNumber, phase };
  }, [progressRatio]);

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto max-w-6xl"
      >
        {/* Section Header */}
        <motion.div variants={fadeUp} className="mb-6 sm:mb-10 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70"
            style={GLASS_LIGHT}
          >
            <Calendar className="size-3 text-emerald-600" strokeWidth={2.6} />
            Tiến trình lâm sàng có thật
          </span>
          <h2 className="mt-3 text-balance text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[44px]">
            Sau 4 tuần.{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Cùng một khuôn mặt.
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-[58ch] text-pretty text-[14px] leading-relaxed text-foreground/65 sm:text-[15.5px]">
            Kéo thanh trượt để xem AI phân tích sự biến đổi của các chỉ số sinh
            học theo từng tuần điều trị với routine tinh gọn.
          </p>
        </motion.div>

        {/* Studio Box Container */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.60) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 24px 64px rgba(31,38,135,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
            ...GPU,
          }}
        >
          {/* Top Control Strip: Timeline Phase & Presets */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-foreground">
                  {currentMetrics.phase}
                </p>
                <p className="text-[10.5px] text-foreground/50">
                  Phản xạ dữ liệu theo thời gian thực (Live Time-Interpolation)
                </p>
              </div>
            </div>

            {/* Quick-Jump Presets */}
            <div className="flex items-center gap-1.5 rounded-full bg-black/5 p-1">
              {PRESETS.map((p) => {
                const isActive =
                  (p.pos === 0 && position < 20) ||
                  (p.pos === 50 && position >= 20 && position <= 80) ||
                  (p.pos === 100 && position > 80);
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPosition(p.pos)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all select-none"
                    style={{
                      background: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#0f172a" : "rgba(15,23,42,0.6)",
                      boxShadow: isActive
                        ? "0 2px 8px rgba(0,0,0,0.08)"
                        : "none",
                    }}
                  >
                    {p.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Slider Frame */}
          <div
            className="relative overflow-hidden rounded-[1.75rem] p-2 sm:p-3"
            style={{ ...GLASS, ...GPU }}
          >
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              role="slider"
              aria-label="So sánh tiến trình phục hồi qua từng tuần"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={position}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight")
                  setPosition((p) => Math.min(100, p + 5));
                if (e.key === "ArrowLeft")
                  setPosition((p) => Math.max(0, p - 5));
              }}
              className="relative aspect-[16/9] sm:aspect-[21/10] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem]"
            >
              {/* BEFORE — Layer */}
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

              {/* AFTER — Clipped by handle position */}
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

              {/* Corner Baseline Badges */}
              <div
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white select-none"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="size-1.5 rounded-full bg-rose-400" />
                Tuần 0 (Mụn & Viêm)
              </div>
              <div
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white select-none"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Tuần 4 (Mọng nước)
              </div>

              {/* Handle Line + Glowing Central Grip */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px"
                style={{
                  left: `${position}%`,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.65))",
                  boxShadow: "0 0 16px rgba(255,255,255,0.85)",
                }}
              />
              <div
                className="pointer-events-none absolute top-1/2 z-10 flex size-9 sm:size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{
                  left: `${position}%`,
                  background: "rgba(255,255,255,0.95)",
                  border: "1.5px solid rgba(255,255,255,0.9)",
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M4 3L1 7L4 11"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 3L13 7L10 11"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── CO-LOCATED LIVE TELEMETRY HUD BAR (Co-located directly beneath the frame) ── */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-3.5">
            {/* Stat 1: Mụn viêm */}
            <div
              className="rounded-2xl p-2.5 sm:p-3.5 shadow-sm border transition-all"
              style={{
                background: "rgba(255,255,255,0.8)",
                borderColor: "rgba(220,38,38,0.2)",
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold text-foreground/80">
                  <CircleDot className="size-3.5 text-red-600" />
                  Mụn viêm
                </span>
                <span className="rounded-full bg-red-500/15 px-1.5 py-0.2 text-[9.5px] sm:text-[10px] font-black text-red-700">
                  -{Math.round(progressRatio * 36)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[18px] sm:text-[24px] font-black tabular-nums text-red-600">
                  {currentMetrics.acne}
                </span>
                <span className="text-[10.5px] font-semibold text-foreground/45">
                  /100 nốt
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-100"
                  style={{ width: `${(currentMetrics.acne / 64) * 100}%` }}
                />
              </div>
            </div>

            {/* Stat 2: Độ ẩm */}
            <div
              className="rounded-2xl p-2.5 sm:p-3.5 shadow-sm border transition-all"
              style={{
                background: "rgba(255,255,255,0.8)",
                borderColor: "rgba(59,130,246,0.2)",
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold text-foreground/80">
                  <Droplet className="size-3.5 text-blue-600" />
                  Độ ẩm
                </span>
                <span className="rounded-full bg-blue-500/15 px-1.5 py-0.2 text-[9.5px] sm:text-[10px] font-black text-blue-700">
                  +{Math.round(progressRatio * 39)}%
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[18px] sm:text-[24px] font-black tabular-nums text-blue-600">
                  {currentMetrics.hydration}%
                </span>
                <span className="text-[10.5px] font-semibold text-foreground/45">
                  ngậm nước
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${currentMetrics.hydration}%` }}
                />
              </div>
            </div>

            {/* Stat 3: Đỏ da */}
            <div
              className="rounded-2xl p-2.5 sm:p-3.5 shadow-sm border transition-all"
              style={{
                background: "rgba(255,255,255,0.8)",
                borderColor: "rgba(225,29,72,0.2)",
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold text-foreground/80">
                  <Flame className="size-3.5 text-rose-600" />
                  Đỏ da
                </span>
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.2 text-[9.5px] sm:text-[10px] font-black text-rose-700">
                  -{Math.round(progressRatio * 34)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[18px] sm:text-[24px] font-black tabular-nums text-rose-600">
                  {currentMetrics.redness}
                </span>
                <span className="text-[10.5px] font-semibold text-foreground/45">
                  kích ứng
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-100"
                  style={{ width: `${(currentMetrics.redness / 58) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11.5px] font-medium text-foreground/50">
            Kéo con trượt để cảm nhận cơ chế tái tạo từng ngày · Bấm phím ← → để di chuyển bước nhỏ
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
