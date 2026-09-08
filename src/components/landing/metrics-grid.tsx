"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Asterisk,
  Check,
  CircleDot,
  Droplet,
  Droplets,
  Eye,
  Flame,
  Layers,
  Palette,
  Sparkles,
  Sun,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { DOTS, FACE_OUTLINE, MESH_LINES } from "./face-mesh-data";
import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type MetricCategory = "oil_acne" | "hydration_barrier" | "pigment_aging";

type Metric = {
  id: string;
  icon: LucideIcon;
  name: string;
  body: string;
  category: MetricCategory;
  categoryLabel: string;
  benchmark: number;
  advice: string;
  // Position on the face heatmap (480×600 viewBox).
  x: number;
  y: number;
  accent: string;
  iconBg: string;
};

// Aligned 1:1 with the 11 numeric fields in src/lib/scoring/engine.ts.
const METRICS: Metric[] = [
  {
    id: "hydration",
    icon: Droplet,
    name: "Độ ẩm",
    category: "hydration_barrier",
    categoryLabel: "Độ ẩm & Hàng rào",
    benchmark: 68,
    advice: "Bổ sung HA đa phân tử trên nền da ẩm",
    body: "Mức nước giữ lại trong lớp sừng. Thấp = da khô, căng, bong tróc.",
    x: 240,
    y: 145,
    accent: "#3b82f6",
    iconBg: "rgba(59,130,246,0.14)",
  },
  {
    id: "sebum",
    icon: Droplets,
    name: "Bã nhờn",
    category: "oil_acne",
    categoryLabel: "Viêm & Tuyến dầu",
    benchmark: 78,
    advice: "Niacinamide 5% + Kẽm PCA kiềm dầu chữ T",
    body: "Cân bằng dầu tự nhiên. Quá ít = da khô rát, quá nhiều = bóng nhờn.",
    x: 240,
    y: 320,
    accent: "#d97706",
    iconBg: "rgba(245,158,11,0.14)",
  },
  {
    id: "acne",
    icon: CircleDot,
    name: "Mụn viêm",
    category: "oil_acne",
    categoryLabel: "Viêm & Tuyến dầu",
    benchmark: 64,
    advice: "BHA 1% + Salicylic làm sạch sâu, tránh nặn mụn tay",
    body: "Số lượng & mức độ viêm của mụn đỏ, mụn mủ, nốt sần đang hoạt động.",
    x: 165,
    y: 295,
    accent: "#ef4444",
    iconBg: "rgba(239,68,68,0.14)",
  },
  {
    id: "pore",
    icon: Aperture,
    name: "Lỗ chân lông",
    category: "oil_acne",
    categoryLabel: "Viêm & Tuyến dầu",
    benchmark: 71,
    advice: "Làm sạch kép buổi tối + Peptide se khít",
    body: "Độ giãn nở của lỗ chân lông — phản ánh độ thông thoáng, tăng tiết dầu.",
    x: 315,
    y: 295,
    accent: "#9333ea",
    iconBg: "rgba(168,85,247,0.14)",
  },
  {
    id: "pigmentation",
    icon: Palette,
    name: "Sắc tố",
    category: "pigment_aging",
    categoryLabel: "Sắc tố & Lão hóa",
    benchmark: 58,
    advice: "Vitamin C buổi sáng kết hợp KCN SPF50 PA++++",
    body: "Đốm nâu, vết thâm sau mụn, nám — vùng tăng melanin cục bộ.",
    x: 145,
    y: 250,
    accent: "#b45309",
    iconBg: "rgba(217,119,6,0.14)",
  },
  {
    id: "wrinkle",
    icon: Waves,
    name: "Nếp nhăn",
    category: "pigment_aging",
    categoryLabel: "Sắc tố & Lão hóa",
    benchmark: 82,
    advice: "Retinol nồng độ thấp bắt đầu 2 lần/tuần + Ceramide",
    body: "Đường li ti, nếp gấp động & nếp tĩnh. Tăng dần theo suy giảm collagen.",
    x: 240,
    y: 110,
    accent: "#475569",
    iconBg: "rgba(100,116,139,0.14)",
  },
  {
    id: "tone",
    icon: Sun,
    name: "Đều màu",
    category: "pigment_aging",
    categoryLabel: "Sắc tố & Lão hóa",
    benchmark: 72,
    advice: "Tranexamic Acid hoặc Alpha Arbutin dưỡng sáng",
    body: "Mức độ đồng nhất tổng thể giữa các vùng má, trán, cằm và mũi.",
    x: 335,
    y: 250,
    accent: "#ea580c",
    iconBg: "rgba(251,146,60,0.14)",
  },
  {
    id: "redness",
    icon: Flame,
    name: "Đỏ da",
    category: "hydration_barrier",
    categoryLabel: "Độ ẩm & Hàng rào",
    benchmark: 42,
    advice: "Serum B5 phục hồi + ngừng hoàn toàn tẩy da chết cơ học",
    body: "Vùng kích ứng, mao mạch giãn — chỉ báo da đang tổn thương hàng rào.",
    x: 175,
    y: 340,
    accent: "#e11d48",
    iconBg: "rgba(244,63,94,0.14)",
  },
  {
    id: "texture",
    icon: Layers,
    name: "Kết cấu",
    category: "hydration_barrier",
    categoryLabel: "Độ ẩm & Hàng rào",
    benchmark: 64,
    advice: "Tẩy tế bào chết hóa học PHA dịu nhẹ định kỳ",
    body: "Độ mịn màng biểu bì. Đo mức độ gồ ghề từ mụn ẩn, sẹo, vảy khô.",
    x: 305,
    y: 340,
    accent: "#0d9488",
    iconBg: "rgba(20,184,166,0.14)",
  },
  {
    id: "dark_circles",
    icon: Eye,
    name: "Quầng thâm",
    category: "pigment_aging",
    categoryLabel: "Sắc tố & Lão hóa",
    benchmark: 50,
    advice: "Kem mắt chứa Caffeine + ngủ sâu trước 23h",
    body: "Sắc tố và vi tuần hoàn quanh mắt — phản ánh chu kỳ ngủ và áp lực.",
    x: 200,
    y: 235,
    accent: "#4f46e5",
    iconBg: "rgba(99,102,241,0.14)",
  },
  {
    id: "blackheads",
    icon: Asterisk,
    name: "Mụn đầu đen",
    category: "oil_acne",
    categoryLabel: "Viêm & Tuyến dầu",
    benchmark: 55,
    advice: "Dầu tẩy trang nhũ hóa kỹ 60s + Mặt nạ đất sét tuần 1 lần",
    body: "Bã nhờn oxy hóa trong lỗ chân lông, tập trung nhiều ở vùng chữ T.",
    x: 240,
    y: 360,
    accent: "#334155",
    iconBg: "rgba(71,85,105,0.14)",
  },
];

const CATEGORIES = [
  { id: "all", label: "Tất cả (11)" },
  { id: "oil_acne", label: "🔥 Mụn & Tuyến dầu" },
  { id: "hydration_barrier", label: "💧 Độ ẩm & Rào da" },
  { id: "pigment_aging", label: "✨ Sắc tố & Lão hóa" },
] as const;

export function MetricsGrid() {
  const [selectedId, setSelectedId] = useState<string>("acne");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const selectedMetric = useMemo(
    () => METRICS.find((m) => m.id === selectedId) || METRICS[0],
    [selectedId],
  );

  const filteredMetrics = useMemo(() => {
    if (activeCategory === "all") return METRICS;
    return METRICS.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

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
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            11 Chỉ số sinh học · Định lượng chính xác 0–100
          </span>
          <h2 className="mt-3 text-balance text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[44px]">
            Mika không nói chung chung. Mika đo từng vị trí.
          </h2>
          <p className="mx-auto mt-2 max-w-[60ch] text-pretty text-[14px] leading-relaxed text-foreground/65 sm:text-[15.5px]">
            Chạm vào bất kỳ điểm nào trên bản đồ khuôn mặt để xem AI giải mã
            tình trạng sinh lý học và hướng khắc phục chuẩn y khoa.
          </p>
        </motion.div>

        {/* Featured Hero Studio Box — Interactive Heatmap + Clinical Spotlight Hub */}
        <motion.div
          variants={fadeUp}
          className="relative mb-6 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 lg:p-9 shadow-2xl"
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
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-16 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />

          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
            {/* ── CỘT TRÁI: INTERACTIVE FACE HEATMAP (6 Cols) ─────────── */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <FaceHeatmap
                metrics={METRICS}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />
              <p className="mt-2.5 text-center text-[11px] font-semibold text-foreground/50">
                👆 Chạm vào các vòng tròn sáng trên mặt để kích hoạt quét laser
              </p>
            </div>

            {/* ── CỘT PHẢI: CLINICAL SPOTLIGHT CAPSULE (6 Cols) ───────── */}
            <div className="lg:col-span-6 space-y-4">
              {/* Selected Metric Deep-Dive Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMetric.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[1.75rem] p-5 shadow-sm border"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    borderColor: `${selectedMetric.accent}40`,
                    boxShadow: `0 12px 32px ${selectedMetric.accent}15, inset 0 1px 0 rgba(255,255,255,0.95)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-xs"
                        style={{
                          background: selectedMetric.iconBg,
                          border: `1px solid ${selectedMetric.accent}40`,
                        }}
                      >
                        <selectedMetric.icon
                          className="size-5.5"
                          style={{ color: selectedMetric.accent }}
                          strokeWidth={2.4}
                        />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[17px] font-bold text-foreground">
                            {selectedMetric.name}
                          </h3>
                          <span
                            className="rounded-full px-2 py-0.2 text-[10px] font-bold"
                            style={{
                              background: `${selectedMetric.accent}18`,
                              color: selectedMetric.accent,
                            }}
                          >
                            {selectedMetric.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/50">
                          Chỉ số chuẩn lâm sàng AI: {selectedMetric.benchmark}/100
                        </p>
                      </div>
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums"
                      style={{
                        background: `${selectedMetric.accent}15`,
                        color: selectedMetric.accent,
                        border: `1px solid ${selectedMetric.accent}30`,
                      }}
                    >
                      {selectedMetric.benchmark >= 70
                        ? "Tối ưu"
                        : selectedMetric.benchmark >= 50
                          ? "Cân bằng"
                          : "Cần xử lý"}
                    </span>
                  </div>

                  {/* Biological Explanation */}
                  <p className="mt-3 text-[13px] leading-relaxed text-foreground/75">
                    {selectedMetric.body}
                  </p>

                  {/* Clinical Advice Capsule */}
                  <div
                    className="mt-3.5 flex items-start gap-2.5 rounded-xl p-3 border"
                    style={{
                      background: `${selectedMetric.accent}08`,
                      borderColor: `${selectedMetric.accent}25`,
                    }}
                  >
                    <Zap
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: selectedMetric.accent }}
                    />
                    <div>
                      <p
                        className="text-[10.5px] font-black uppercase tracking-wider"
                        style={{ color: selectedMetric.accent }}
                      >
                        Phác đồ can thiệp ưu tiên:
                      </p>
                      <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-foreground/80">
                        {selectedMetric.advice}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 11 Interactive Selector Chips */}
              <div>
                <p className="mb-2 text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
                  Chọn nhanh 1 trong 11 chỉ số:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {METRICS.map((m) => {
                    const isSelected = m.id === selectedId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-all select-none"
                        style={{
                          background: isSelected
                            ? m.accent
                            : "rgba(255,255,255,0.7)",
                          color: isSelected ? "#ffffff" : m.accent,
                          border: `1px solid ${isSelected ? m.accent : `${m.accent}33`}`,
                          boxShadow: isSelected
                            ? `0 4px 12px ${m.accent}35`
                            : "none",
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{
                            background: isSelected ? "#ffffff" : m.accent,
                          }}
                        />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── DETAIL GRID WITH CATEGORY FILTERING (Zero-Scroll on Mobile) ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 px-1">
          <p className="text-[13px] font-bold text-foreground">
            Khám phá chi tiết theo nhóm vấn đề:
          </p>
          <div className="flex flex-wrap gap-1 rounded-full bg-black/5 p-1">
            {CATEGORIES.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className="rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all select-none"
                  style={{
                    background: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#0f172a" : "rgba(15,23,42,0.6)",
                    boxShadow: isActive
                      ? "0 2px 8px rgba(0,0,0,0.08)"
                      : "none",
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Grid of Cards */}
        <motion.div
          layout
          variants={fadeUp}
          className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 lg:grid-cols-4"
        >
          {filteredMetrics.map((m) => (
            <MetricCard
              key={m.id}
              metric={m}
              isSelected={m.id === selectedId}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FACE HEATMAP WITH INTERACTIVE RETICLE SPOTLIGHT
// ════════════════════════════════════════════════════════════════════════

function FaceHeatmap({
  metrics,
  selectedId,
  onSelect,
}: {
  metrics: Metric[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[320px] sm:max-w-[360px]"
      style={GPU}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[1.75rem]"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.95))",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 12px 32px rgba(31,38,135,0.08)",
        }}
      >
        {/* Soft background mesh glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(168,85,247,0.12), transparent 50%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.12), transparent 50%)",
          }}
        />

        <svg
          viewBox="0 0 480 600"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="heatmap-face"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient
              id="mesh-line-light"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(148,163,184,0.5)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.2)" />
            </linearGradient>
          </defs>

          {/* Soft face silhouette */}
          <path
            d={FACE_OUTLINE}
            fill="rgba(255,255,255,0.5)"
            stroke="url(#heatmap-face)"
            strokeWidth="1.5"
          />

          {/* High-tech Face Mesh Lines */}
          <g>
            {MESH_LINES.map(([[x1, y1], [x2, y2]], idx) => (
              <line
                key={`line-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#mesh-line-light)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Mesh Nodes */}
          <g>
            {DOTS.map(([x, y], idx) => (
              <circle
                key={`dot-${idx}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="rgba(148,163,184,0.6)"
              />
            ))}
          </g>

          {/* Metric Interactive Hotspots */}
          {metrics.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <g
                key={m.id}
                onClick={() => onSelect(m.id)}
                className="cursor-pointer"
              >
                {/* Click hitbox for mobile fingers */}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="24"
                  fill="transparent"
                />

                {/* Outer pulse animation */}
                <motion.circle
                  cx={m.x}
                  cy={m.y}
                  r={isSelected ? 20 : 12}
                  fill={m.accent}
                  fillOpacity={isSelected ? 0.35 : 0.15}
                  animate={{
                    r: isSelected ? [18, 26, 18] : [12, 18, 12],
                    fillOpacity: isSelected ? [0.4, 0.1, 0.4] : [0.2, 0.05, 0.2],
                  }}
                  transition={{
                    duration: isSelected ? 1.6 : 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Laser Targeting Reticle when selected */}
                {isSelected && (
                  <motion.circle
                    cx={m.x}
                    cy={m.y}
                    r="16"
                    fill="none"
                    stroke={m.accent}
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}

                {/* Solid core */}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isSelected ? 7 : 5}
                  fill={m.accent}
                  style={{
                    filter: `drop-shadow(0 0 ${isSelected ? "12px" : "6px"} ${m.accent})`,
                  }}
                />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="2"
                  fill="white"
                  opacity="0.95"
                />
              </g>
            );
          })}
        </svg>

        {/* Top Tag HUD */}
        <div className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[9.5px] font-mono font-bold uppercase tracking-wider text-foreground/65 backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LASER AI SCAN · 11 HOTSPOTS
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// COMPACT METRIC CARD
// ════════════════════════════════════════════════════════════════════════

function MetricCard({
  metric,
  isSelected,
  onSelect,
}: {
  metric: Metric;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = metric.icon;
  return (
    <motion.article
      layout
      variants={fadeUp}
      onClick={onSelect}
      className="relative flex cursor-pointer flex-col gap-2 rounded-2xl p-3.5 sm:p-4 transition-all active:scale-98 select-none"
      style={{
        ...GLASS,
        ...GPU,
        border: isSelected
          ? `1.5px solid ${metric.accent}`
          : "1px solid rgba(255,255,255,0.8)",
        boxShadow: isSelected
          ? `0 8px 24px ${metric.accent}20, inset 0 1px 0 rgba(255,255,255,0.95)`
          : "0 4px 16px rgba(31,38,135,0.05)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="flex size-8.5 sm:size-9 items-center justify-center rounded-xl"
          style={{
            background: metric.iconBg,
            border: `1px solid ${metric.accent}33`,
          }}
        >
          <Icon
            className="size-4 sm:size-4.5"
            strokeWidth={2.4}
            style={{ color: metric.accent }}
          />
        </span>
        <span className="text-[11px] font-bold tabular-nums text-foreground/45">
          {metric.benchmark}/100
        </span>
      </div>

      <div>
        <h3 className="text-[13.5px] sm:text-[14px] font-bold tracking-tight text-foreground leading-snug">
          {metric.name}
        </h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/60 line-clamp-2">
          {metric.body}
        </p>
      </div>
    </motion.article>
  );
}
