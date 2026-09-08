"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  Droplet,
  Flame,
  type LucideIcon,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";

import type { SliderVibe } from "@/components/onboarding/liquid-glass-slider";

import { IrisCta } from "./iris-cta";
import { GLASS_LIGHT, GPU, SPRING, fadeUp, stagger } from "./landing-tokens";

// ════════════════════════════════════════════════════════════════════════
// VIBE LADDERS — Dynamic status text beneath sliders
// ════════════════════════════════════════════════════════════════════════

function waterVibe(v: number): SliderVibe {
  if (v <= 1.0)
    return { label: "SOS — tế bào khát nước", emoji: "🆘" };
  if (v <= 1.5)
    return { label: "Hơi thiếu — da dễ khô ráp", emoji: "🌵" };
  if (v <= 2.25)
    return { label: "Đủ chuẩn — màng ẩm mọng màng", emoji: "💧" };
  return { label: "Hydration goddess — tế bào căng bóng", emoji: "🌊" };
}

function sleepVibe(v: number): SliderVibe {
  if (v <= 5)
    return { label: "Cú đêm — cortisol cao, màng yếu", emoji: "🦉" };
  if (v <= 6.5)
    return { label: "Tạm ổn — chưa chạm deep sleep HGH", emoji: "😴" };
  if (v <= 8.5)
    return { label: "Sweet spot vàng — collagen tái tạo", emoji: "🌙" };
  return { label: "Beauty sleep tier S+ phục hồi", emoji: "👑" };
}

function stressVibe(v: number): SliderVibe {
  if (v <= 1)
    return { label: "Thư thái — da sáng hồng hào", emoji: "🧘" };
  if (v <= 2)
    return { label: "Ổn định — kiểm soát áp lực tốt", emoji: "🌿" };
  if (v <= 3)
    return { label: "Áp lực vừa — tuyến dầu tăng tiết", emoji: "💼" };
  if (v <= 4)
    return { label: "Áp lực cao — kích hoạt viêm & mụn", emoji: "⚡" };
  return { label: "Burnout nặng — gốc tự do phá màng", emoji: "🔥" };
}

// ════════════════════════════════════════════════════════════════════════
// LIVE SKIN BIO-METRIC ENGINE
// Quantifies real physiological impact of lifestyle inputs
// ════════════════════════════════════════════════════════════════════════

function computeSkinMetrics(
  water: number,
  sleep: number,
  stress: number,
  spf: boolean,
) {
  // Normalize inputs
  const waterNorm = Math.min(1, Math.max(0, (water - 0.5) / 2.0)); // 0 to 1
  const sleepNorm = Math.min(1, Math.max(0, (sleep - 4) / 4.5)); // 0 to 1
  const stressPenalty = (stress - 1) / 4; // 0 to 1

  // 1. Overall Skin Health Score (0 - 100)
  const rawScore =
    waterNorm * 30 +
    sleepNorm * 35 +
    (1 - stressPenalty) * 20 +
    (spf ? 15 : 0);
  const skinScore = Math.round(Math.min(100, Math.max(28, rawScore)));

  // 2. Hydration percentage (25% - 98%)
  const hydration = Math.round(
    Math.min(
      98,
      Math.max(25, waterNorm * 65 + sleepNorm * 25 + (1 - stressPenalty) * 10),
    ),
  );

  // 3. Barrier Integrity percentage (25% - 96%)
  const barrier = Math.round(
    Math.min(
      96,
      Math.max(
        25,
        (sleepNorm * 40 + (spf ? 35 : 10) + waterNorm * 25) *
          (1 - stressPenalty * 0.15),
      ),
    ),
  );

  // 4. Sebum & Acne Risk percentage (12% - 88% - lower is better)
  const acneRisk = Math.round(
    Math.min(
      88,
      Math.max(
        12,
        stressPenalty * 45 +
          (1 - sleepNorm) * 25 +
          (1 - waterNorm) * 20 +
          (spf ? 0 : 10),
      ),
    ),
  );

  // 5. Bio Age Delta (-4 to +6 years)
  let bioAgeDelta = 0;
  if (skinScore >= 88) bioAgeDelta = -4;
  else if (skinScore >= 80) bioAgeDelta = -2;
  else if (skinScore >= 70) bioAgeDelta = 0;
  else if (skinScore >= 55) bioAgeDelta = 2;
  else if (skinScore >= 42) bioAgeDelta = 4;
  else bioAgeDelta = 6;

  return {
    skinScore,
    hydration,
    barrier,
    acneRisk,
    bioAgeDelta,
  };
}

function getScoreBand(score: number) {
  if (score < 45) {
    return {
      label: "Báo động đỏ",
      text: "#e11d48",
      ringFrom: "#f43f5e",
      ringTo: "#fb7185",
      halo: "rgba(244,63,94,0.25)",
      bg: "rgba(244,63,94,0.12)",
    };
  }
  if (score < 68) {
    return {
      label: "Cần cải thiện",
      text: "#d97706",
      ringFrom: "#f59e0b",
      ringTo: "#fbbf24",
      halo: "rgba(245,158,11,0.25)",
      bg: "rgba(245,158,11,0.12)",
    };
  }
  if (score < 85) {
    return {
      label: "Khá ổn định",
      text: "#2563eb",
      ringFrom: "#3b82f6",
      ringTo: "#60a5fa",
      halo: "rgba(59,130,246,0.25)",
      bg: "rgba(59,130,246,0.12)",
    };
  }
  return {
    label: "Rạng rỡ · Tối ưu",
    text: "#059669",
    ringFrom: "#10b981",
    ringTo: "#34d399",
    halo: "rgba(16,185,129,0.25)",
    bg: "rgba(16,185,129,0.12)",
  };
}

function getTruthDiagnosis(
  water: number,
  sleep: number,
  stress: number,
  spf: boolean,
): string {
  if (!spf) {
    return "Không thoa kem chống nắng khiến tia UVA bẻ gãy elastin nhanh gấp 3 lần — dù bạn uống 3L nước hay ngủ 8h. SPF là lớp khiên tiên quyết!";
  }
  if (water < 1.25 && stress >= 4) {
    return "Căng thẳng cao kết hợp thiếu nước: cơ thể tự tăng tiết 45% dầu vùng chữ T bù ẩm. Đây là da mất nước ngấm ngầm (Dehydrated Oily Skin).";
  }
  if (sleep < 6 && stress >= 3) {
    return "Ngủ dưới 6h kết hợp áp lực làm gián đoạn đỉnh tiết hormone HGH lúc 23h–2h, làm chậm sừng hóa khiến tế bào chết tích tụ và lộ quầng thâm.";
  }
  if (water >= 2.0 && sleep >= 7.5 && stress <= 2 && spf) {
    return "Nhịp sinh học lý tưởng! Khả năng giữ nước TEWL đạt mức kiên cố, vi tuần hoàn mao mạch tối đa giúp da hấp thu trọn vẹn mọi hoạt chất dưỡng da.";
  }
  if (water < 1.5) {
    return `Lượng nước ${water}L/ngày chưa bù đắp kịp lượng thất thoát qua điều hòa. Hãy nạp thêm 2–3 ly nước để kích hoạt độ căng bóng tế bào.`;
  }
  return "Các chỉ số cơ bản đang ổn định. Duy trì nhịp sống này kết hợp routine phục hồi chuẩn hóa sẽ giúp da thăng hạng vượt bậc.";
}

// ════════════════════════════════════════════════════════════════════════
// COMPACT BIO-SLIDER COMPONENT (Ultra-ergonomic, zero wasted vertical space)
// ════════════════════════════════════════════════════════════════════════

type CompactBioSliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  icon: LucideIcon;
  label: string;
  display: string;
  fillFrom: string;
  fillTo: string;
  vibe: SliderVibe;
};

function CompactBioSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  icon: Icon,
  label,
  display,
  fillFrom,
  fillTo,
  vibe,
}: CompactBioSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.min(max, Math.max(min, stepped));
      const rounded = Number(clamped.toFixed(2));
      if (rounded !== value) onChange(rounded);
    },
    [min, max, step, onChange, value],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  const pct = ((value - min) / (max - min)) * 100;
  const haloOpacity = 0.15 + (pct / 100) * 0.45;

  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={display}
      tabIndex={0}
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          onChange(Math.min(max, value + step));
          e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          onChange(Math.max(min, value - step));
          e.preventDefault();
        }
      }}
      className="relative h-[50px] sm:h-[52px] w-full cursor-pointer touch-none select-none overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 active:scale-[0.99] transition-transform"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(31,38,135,0.07)",
      }}
    >
      {/* Liquid Colored Fill */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{
          background: `linear-gradient(90deg, ${fillFrom}, ${fillTo})`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
        animate={{ width: `${pct}%` }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 28,
          mass: 0.7,
        }}
      />

      {/* Brightening halo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          background: `radial-gradient(120% 90% at 50% 50%, ${fillTo} 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
        animate={{
          width: `${Math.min(100, pct + 6)}%`,
          opacity: haloOpacity,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.7,
        }}
      />

      {/* Top reflection line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      {/* Integrated Track Content: Icon + Label + Vibe Badge + Numeric Value */}
      <div className="pointer-events-none relative z-10 flex h-full items-center justify-between px-3 pr-3.5 sm:px-4 sm:pr-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Squircle Icon Bubble */}
          <span
            className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl text-foreground/80"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 2px 8px rgba(31,38,135,0.08)",
            }}
          >
            <Icon className="size-4" />
          </span>

          {/* Title & Dynamic Vibe Pill */}
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] sm:text-[12.5px] font-bold text-foreground leading-tight truncate">
              {label}
            </span>
            <span className="text-[10px] sm:text-[10.5px] font-medium text-foreground/65 leading-tight truncate max-w-[170px] sm:max-w-[240px]">
              {vibe.emoji} {vibe.label}
            </span>
          </div>
        </div>

        {/* Live Stepped Value */}
        <span className="text-[13.5px] sm:text-[15px] font-black tabular-nums tracking-tight text-foreground shrink-0 ml-2">
          {display}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════

export function SliderDemo({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  // Inputs
  const [water, setWater] = useState(1.75); // liters
  const [sleep, setSleep] = useState(7); // hours
  const [stress, setStress] = useState(2); // 1-5
  const [spf, setSpf] = useState(true); // boolean

  // Real-time calculations
  const metrics = useMemo(
    () => computeSkinMetrics(water, sleep, stress, spf),
    [water, sleep, stress, spf],
  );
  const band = useMemo(() => getScoreBand(metrics.skinScore), [metrics.skinScore]);
  const diagnosis = useMemo(
    () => getTruthDiagnosis(water, sleep, stress, spf),
    [water, sleep, stress, spf],
  );

  return (
    <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
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
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Bio-Simulator · Thử nghiệm tương tác
          </span>
          <h2 className="mt-3 text-balance text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px]">
            Thấu hiểu làn da qua những con số trung thực.
          </h2>
          <p className="mx-auto mt-2 max-w-[58ch] text-pretty text-[14px] leading-relaxed text-foreground/65 sm:text-[15.5px]">
            Không phán đoán cảm tính. Kéo các thanh sinh học để thấy cơ chế làn da
            phản hồi tức thì ngay trên màn hình theo thời gian thực.
          </p>
        </motion.div>

        {/* Studio Box Container */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 lg:p-9 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,247,237,0.45) 50%, rgba(255,255,255,0.88) 100%)",
            backdropFilter: "blur(32px) saturate(190%)",
            WebkitBackdropFilter: "blur(32px) saturate(190%)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 32px 80px rgba(31,38,135,0.09), 0 4px 20px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.95)",
            ...GPU,
          }}
        >
          {/* Subtle top reflection ray */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />

          {/* ── MOBILE ONLY: COCKPIT TELEMETRY HUD (Co-located above sliders) ── */}
          <div
            className="lg:hidden mb-4 overflow-hidden rounded-[1.75rem] p-3 shadow-md"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.8) 100%)",
              border: "1.5px solid rgba(255,255,255,0.95)",
              boxShadow: `0 12px 28px ${band.halo}, inset 0 1px 0 rgba(255,255,255,0.95)`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Mini Score Ring */}
              <ScoreRing
                score={metrics.skinScore}
                band={band}
                reduced={reduced}
                size={58}
                stroke={5.5}
              />

              {/* Band Badge & Bio-Age */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider"
                    style={{ background: band.bg, color: band.text }}
                  >
                    {band.label}
                  </span>
                  <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-foreground/45">
                    Dự báo tuổi da
                  </p>
                  <p
                    className="text-[13px] font-black tracking-tight"
                    style={{
                      color: metrics.bioAgeDelta <= 0 ? "#059669" : "#e11d48",
                    }}
                  >
                    {metrics.bioAgeDelta <= 0
                      ? `Trẻ hơn ${Math.abs(metrics.bioAgeDelta)} tuổi`
                      : `Lão hóa +${metrics.bioAgeDelta} tuổi`}
                  </p>
                </div>
              </div>

              {/* 4 Micro Bio-Metric Gauges (2x2) */}
              <div className="grid grid-cols-2 gap-1.5 shrink-0">
                {/* Hydration */}
                <div className="flex flex-col rounded-lg bg-blue-50/90 px-2 py-1 border border-blue-200/60 min-w-[68px]">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-blue-900/70 font-medium">💧 Ẩm</span>
                    <span className="font-extrabold text-blue-700 tabular-nums">
                      {metrics.hydration}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-blue-200/50">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${metrics.hydration}%` }}
                    />
                  </div>
                </div>

                {/* Barrier */}
                <div className="flex flex-col rounded-lg bg-emerald-50/90 px-2 py-1 border border-emerald-200/60 min-w-[68px]">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-emerald-900/70 font-medium">🛡️ Rào</span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {metrics.barrier}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-emerald-200/50">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${metrics.barrier}%` }}
                    />
                  </div>
                </div>

                {/* Sebum / Acne Risk */}
                <div
                  className="flex flex-col rounded-lg px-2 py-1 border min-w-[68px]"
                  style={{
                    background:
                      metrics.acneRisk > 45
                        ? "rgba(254,242,242,0.9)"
                        : "rgba(240,253,244,0.9)",
                    borderColor:
                      metrics.acneRisk > 45
                        ? "rgba(254,202,202,0.8)"
                        : "rgba(187,247,208,0.8)",
                  }}
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-foreground/70 font-medium">⚡ Dầu</span>
                    <span
                      className="font-extrabold tabular-nums"
                      style={{
                        color: metrics.acneRisk > 45 ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {metrics.acneRisk}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${metrics.acneRisk}%`,
                        background:
                          metrics.acneRisk > 45 ? "#ef4444" : "#10b981",
                      }}
                    />
                  </div>
                </div>

                {/* UV Shield */}
                <div
                  className="flex flex-col rounded-lg px-2 py-1 border min-w-[68px]"
                  style={{
                    background: spf
                      ? "rgba(254,243,199,0.9)"
                      : "rgba(254,242,242,0.9)",
                    borderColor: spf
                      ? "rgba(253,230,138,0.8)"
                      : "rgba(254,202,202,0.8)",
                  }}
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-foreground/70 font-medium">☀️ UV</span>
                    <span
                      className="font-extrabold tabular-nums"
                      style={{ color: spf ? "#d97706" : "#dc2626" }}
                    >
                      {spf ? "98%" : "0%"}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: spf ? "98%" : "8%",
                        background: spf ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Split-Studio Layout */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
            {/* ── CỘT TRÁI: BIO-INPUTS CONSOLE ───────────────────────── */}
            <div className="space-y-2.5 sm:space-y-3.5 lg:col-span-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-6.5 sm:size-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                    <Activity className="size-3.5 sm:size-4" />
                  </span>
                  <div>
                    <h3 className="text-[13px] sm:text-[14px] font-bold text-foreground">
                      Bảng Điều Khiển Sinh Học
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-foreground/50">
                      Kéo trượt để thay đổi thói quen hằng ngày
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-foreground/50">
                  Tùy biến
                </span>
              </div>

              {/* Slider 1: Nước */}
              <CompactBioSlider
                value={water}
                min={0.5}
                max={3.0}
                step={0.25}
                onChange={setWater}
                icon={Droplet}
                label="Lượng nước"
                display={`${water.toFixed(2).replace(/\.?0+$/, "")} L (${Math.round(water * 4)} ly)`}
                fillFrom="rgba(59,130,246,0.55)"
                fillTo="rgba(56,189,248,0.85)"
                vibe={waterVibe(water)}
              />

              {/* Slider 2: Giấc ngủ */}
              <CompactBioSlider
                value={sleep}
                min={4}
                max={10}
                step={0.5}
                onChange={setSleep}
                icon={Moon}
                label="Giấc ngủ"
                display={`${sleep.toFixed(1).replace(/\.0$/, "")} giờ`}
                fillFrom="rgba(99,102,241,0.55)"
                fillTo="rgba(167,139,250,0.85)"
                vibe={sleepVibe(sleep)}
              />

              {/* Slider 3: Stress */}
              <CompactBioSlider
                value={stress}
                min={1}
                max={5}
                step={1}
                onChange={setStress}
                icon={Flame}
                label="Mức Stress"
                display={
                  stress <= 1
                    ? "Rất thấp"
                    : stress === 2
                      ? "Ổn định"
                      : stress === 3
                        ? "Vừa phải"
                        : stress === 4
                          ? "Áp lực cao"
                          : "Burnout"
                }
                fillFrom="rgba(251,146,60,0.55)"
                fillTo="rgba(239,68,68,0.85)"
                vibe={stressVibe(stress)}
              />

              {/* Toggle: Kem chống nắng */}
              <div
                onClick={() => setSpf(!spf)}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 sm:p-3.5 transition-all select-none active:scale-[0.99]"
                style={{
                  background: spf
                    ? "linear-gradient(135deg, rgba(254,243,199,0.7), rgba(255,255,255,0.85))"
                    : "rgba(255,255,255,0.55)",
                  border: spf
                    ? "1.5px solid rgba(245,158,11,0.45)"
                    : "1px solid rgba(255,255,255,0.7)",
                  boxShadow: spf
                    ? "0 6px 20px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.95)"
                    : "0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: spf
                        ? "rgba(245,158,11,0.18)"
                        : "rgba(255,255,255,0.8)",
                      color: spf ? "#d97706" : "inherit",
                    }}
                  >
                    <Sun className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] sm:text-[12.5px] font-bold text-foreground leading-tight">
                        Thoa kem chống nắng mỗi sáng
                      </p>
                      {spf && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[9.5px] font-black text-amber-700">
                          +15đ
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[10.5px] text-foreground/60 leading-tight">
                      Chặn 98% UVA/UVB, bảo vệ elastin và sợi collagen
                    </p>
                  </div>
                </div>

                {/* iOS Switch */}
                <div
                  className="relative flex h-5.5 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200"
                  style={{
                    background: spf
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : "rgba(0, 0, 0, 0.14)",
                  }}
                >
                  <motion.div
                    layout
                    transition={SPRING}
                    className="flex size-4.5 items-center justify-center rounded-full bg-white shadow-md"
                    style={{
                      transform: spf
                        ? "translateX(18px)"
                        : "translateX(0px)",
                    }}
                  >
                    {spf && <Check className="size-2.5 text-amber-600 stroke-[3]" />}
                  </motion.div>
                </div>
              </div>

              {/* xAI Radical Truth Diagnostic Card (Visible right below sliders) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={diagnosis}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl p-3 sm:p-3.5 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(240,253,244,0.75) 0%, rgba(254,243,199,0.55) 100%)",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 mt-0.5">
                      <Zap className="size-3" />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                        Chẩn đoán khoa học trung thực:
                      </p>
                      <p className="mt-0.5 text-[11.5px] sm:text-[12px] leading-relaxed text-foreground/80">
                        {diagnosis}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── CỘT PHẢI: LIVE SKIN TRUTH DASHBOARD (Desktop only - Mobile uses Cockpit HUD) ── */}
            <div className="space-y-3.5 lg:col-span-6 hidden lg:block">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground">
                      Sinh Trắc Học Da Thời Gian Thực
                    </h3>
                    <p className="text-[11px] text-foreground/50">
                      Phản hồi toán học 60fps theo từng nhịp sống
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* Hero Skin Health Gauge & Bio-Age Card */}
              <div
                className="relative overflow-hidden rounded-[1.75rem] p-4.5 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,243,255,0.6) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.9)",
                  boxShadow: `0 16px 40px ${band.halo}, inset 0 1px 0 rgba(255,255,255,0.95)`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Gauge SVG */}
                  <ScoreRing
                    score={metrics.skinScore}
                    band={band}
                    reduced={reduced}
                    size={96}
                    stroke={7.5}
                  />

                  {/* Score & Bio Age Breakdown */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                        style={{
                          background: band.bg,
                          color: band.text,
                        }}
                      >
                        {band.label}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground/55">
                        Skin Vitality Score
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/45">
                        Dự báo tuổi sinh học da
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span
                          className="text-[18px] font-black tracking-tight"
                          style={{
                            color:
                              metrics.bioAgeDelta <= 0 ? "#059669" : "#e11d48",
                          }}
                        >
                          {metrics.bioAgeDelta <= 0
                            ? `Trẻ hơn ${Math.abs(metrics.bioAgeDelta)} tuổi`
                            : `Lão hóa nhanh +${metrics.bioAgeDelta} tuổi`}
                        </span>
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] leading-relaxed text-foreground/60">
                      {metrics.bioAgeDelta <= 0
                        ? "Làn da được ngậm nước và bảo vệ lý tưởng."
                        : "Da đang chịu stress oxy hóa và mất nước biểu bì."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Quantitative Bio-Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Metric 1: Hydration */}
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm border border-white/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground/60">
                      💧 Cấp ẩm biểu bì
                    </span>
                    <span className="text-[13px] font-black text-blue-600 tabular-nums">
                      {metrics.hydration}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      className="h-full rounded-full bg-blue-500"
                      animate={{ width: `${metrics.hydration}%` }}
                      transition={SPRING}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/50">
                    {metrics.hydration >= 75 ? "Mọng nước đàn hồi" : "Khô rát biểu bì"}
                  </p>
                </div>

                {/* Metric 2: Barrier */}
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm border border-white/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground/60">
                      🛡️ Hàng rào ẩm
                    </span>
                    <span className="text-[13px] font-black text-emerald-600 tabular-nums">
                      {metrics.barrier}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      animate={{ width: `${metrics.barrier}%` }}
                      transition={SPRING}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/50">
                    {metrics.barrier >= 75 ? "Khóa ẩm kiên cố" : "Dễ kích ứng TEWL"}
                  </p>
                </div>

                {/* Metric 3: Sebum / Acne Risk */}
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm border border-white/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground/60">
                      ⚡ Nguy cơ mụn dầu
                    </span>
                    <span
                      className="text-[13px] font-black tabular-nums"
                      style={{
                        color: metrics.acneRisk > 45 ? "#e11d48" : "#059669",
                      }}
                    >
                      {metrics.acneRisk}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          metrics.acneRisk > 45 ? "#ef4444" : "#10b981",
                      }}
                      animate={{ width: `${metrics.acneRisk}%` }}
                      transition={SPRING}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/50">
                    {metrics.acneRisk <= 35 ? "Tuyến dầu cân bằng" : "Bã nhờn bùng phát"}
                  </p>
                </div>

                {/* Metric 4: SPF Photo-Shield */}
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm border border-white/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground/60">
                      ☀️ Chống tia UV
                    </span>
                    <span
                      className="text-[13px] font-black tabular-nums"
                      style={{
                        color: spf ? "#d97706" : "#e11d48",
                      }}
                    >
                      {spf ? "Lá chắn 98%" : "0% Rủi ro"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: spf ? "#f59e0b" : "#ef4444",
                      }}
                      animate={{ width: spf ? "98%" : "8%" }}
                      transition={SPRING}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/50">
                    {spf ? "Ngăn ngừa đốm nâu" : "Phá hủy collagen"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Payoff & Call-To-Action */}
          <div className="mt-5 sm:mt-7 flex flex-col items-center justify-between gap-3.5 border-t border-black/5 pt-4.5 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="flex size-6.5 sm:size-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-600">
                <ShieldCheck className="size-3.5 sm:size-4" />
              </span>
              <p className="text-[11.5px] sm:text-[12px] leading-relaxed text-foreground/65">
                <span className="font-bold text-foreground">
                  100% Thuật toán định lượng lâm sàng.
                </span>{" "}
                Không tô vẽ điểm số để ép bán mỹ phẩm.
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0 flex justify-center">
              <IrisCta
                label="Quét mặt thật để lấy số đo chuẩn"
                onClick={onCta}
                reduced={reduced}
                size="md"
                icon={ArrowRight}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SCORE RING COMPONENT (Flexible size for desktop & compact mobile HUD)
// ════════════════════════════════════════════════════════════════════════

function ScoreRing({
  score,
  band,
  reduced,
  size = 96,
  stroke = 7.5,
}: {
  score: number;
  band: ReturnType<typeof getScoreBand>;
  reduced: boolean;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const isMini = size < 70;
  const gradientId = `ring-grad-${size}`;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={band.ringFrom} />
            <stop offset="100%" stopColor={band.ringTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={reduced ? { duration: 0 } : SPRING}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`${isMini ? "text-[18px]" : "text-[28px]"} font-black leading-none tabular-nums tracking-tight`}
          style={{ color: band.text }}
        >
          {score}
        </span>
        {!isMini && (
          <span className="mt-0.5 text-[8.5px] font-bold uppercase tracking-wider text-foreground/45">
            Điểm da
          </span>
        )}
      </div>
    </div>
  );
}
