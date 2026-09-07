"use client";

import { motion } from "framer-motion";
import {
  Aperture,
  Asterisk,
  CircleDot,
  Droplet,
  Droplets,
  Eye,
  Flame,
  Layers,
  Palette,
  Sun,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { DOTS, FACE_OUTLINE, MESH_LINES } from "./face-mesh-data";
import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Metric = {
  id: string;
  icon: LucideIcon;
  name: string;
  body: string;
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
    body: "Mức nước giữ lại trong lớp sừng. Thấp = da khô, căng, bong.",
    x: 240,
    y: 145,
    accent: "#3b82f6",
    iconBg: "rgba(59,130,246,0.14)",
  },
  {
    id: "sebum",
    icon: Droplets,
    name: "Bã nhờn",
    body: "Cân bằng dầu tự nhiên. Quá ít = da khô, quá nhiều = bóng dầu.",
    x: 240,
    y: 320,
    accent: "#d97706",
    iconBg: "rgba(245,158,11,0.14)",
  },
  {
    id: "acne",
    icon: CircleDot,
    name: "Mụn viêm",
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
    body: "Đường li ti, nếp gấp động & nếp tĩnh. Tăng dần theo collagen.",
    x: 240,
    y: 110,
    accent: "#475569",
    iconBg: "rgba(100,116,139,0.14)",
  },
  {
    id: "tone",
    icon: Sun,
    name: "Đều màu",
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
    body: "Vùng kích ứng, mao mạch giãn — chỉ báo da đang bị tổn thương hàng rào.",
    x: 175,
    y: 340,
    accent: "#e11d48",
    iconBg: "rgba(244,63,94,0.14)",
  },
  {
    id: "texture",
    icon: Layers,
    name: "Kết cấu",
    body: "Độ mịn của bề mặt da. Đo độ gồ ghề từ mụn, sẹo, vảy bong.",
    x: 305,
    y: 340,
    accent: "#0d9488",
    iconBg: "rgba(20,184,166,0.14)",
  },
  {
    id: "dark_circles",
    icon: Eye,
    name: "Quầng thâm",
    body: "Sắc tố và mạch máu vùng quanh mắt — phản ánh giấc ngủ, di truyền.",
    x: 200,
    y: 235,
    accent: "#4f46e5",
    iconBg: "rgba(99,102,241,0.14)",
  },
  {
    id: "blackheads",
    icon: Asterisk,
    name: "Mụn đầu đen",
    body: "Bã nhờn oxy hóa trong lỗ chân lông. Tập trung quanh vùng chữ T.",
    x: 240,
    y: 360,
    accent: "#334155",
    iconBg: "rgba(71,85,105,0.14)",
  },
];

export function MetricsGrid() {
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
            <span className="size-1.5 rounded-full bg-emerald-500" />
            11 chỉ số · Không giấu một con số nào
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Mika không nói chung chung. Mika đo từng thứ một.
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
            Mỗi chỉ số là một con số 0–100. Bạn thấy được đúng vùng nào đang
            yếu, đúng vùng nào đã ổn — và bạn được giải thích vì sao.
          </p>
        </motion.div>

        {/* Featured hero card — face heatmap of all 11 metrics at once */}
        <motion.div
          variants={fadeUp}
          className="relative mb-6 overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10"
          style={{ ...GLASS, ...GPU }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-16 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <FaceHeatmap metrics={METRICS} />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                Bản đồ chỉ số
              </span>
              <h3 className="mt-2 text-balance text-[22px] font-semibold leading-tight tracking-tight text-foreground sm:text-[26px]">
                Mỗi vùng da, một câu chuyện riêng.
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/65">
                AI bắt từng cụm điểm mốc và quy về một vị trí trên khuôn mặt
                bạn. Chạm vào con số — Mika kể vì sao nó đang ở mức đó.
              </p>

              {/* Compact chip strip — all 11 metrics with their accents */}
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {METRICS.map((m) => (
                  <li
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{
                      background: m.iconBg,
                      border: `1px solid ${m.accent}33`,
                      color: m.accent,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: m.accent }}
                    />
                    {m.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Detail grid — same 11 metrics with description text */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {METRICS.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// Stylized face SVG with 11 hotspots — one per metric, colored by the
// metric's accent. Hotspots pulse subtly to draw the eye.
function FaceHeatmap({ metrics }: { metrics: Metric[] }) {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[360px]"
      style={GPU}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[1.5rem]"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.95))",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 12px 32px rgba(31,38,135,0.08)",
        }}
      >
        {/* Soft mesh blobs in background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(168,85,247,0.10), transparent 50%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.10), transparent 50%)",
          }}
        />

        <svg
          viewBox="0 0 480 600"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="heatmap-face" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="mesh-line-light" x1="0%" y1="0%" x2="100%" y2="100%">
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

          {/* High-tech Face Mesh */}
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

          {/* Metric hotspots */}
          {metrics.map((m, idx) => (
            <motion.g
              key={m.id}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: 0.1 + idx * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Outer pulse ring */}
              <motion.circle
                cx={m.x}
                cy={m.y}
                r="14"
                fill={m.accent}
                fillOpacity="0.25"
                animate={{
                  r: [12, 22, 12],
                  fillOpacity: [0.30, 0.0, 0.30],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.15,
                }}
              />
              {/* Solid core */}
              <circle
                cx={m.x}
                cy={m.y}
                r="6"
                fill={m.accent}
                style={{
                  filter: `drop-shadow(0 0 8px ${m.accent})`,
                }}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r="2.5"
                fill="white"
                opacity="0.95"
              />
            </motion.g>
          ))}
        </svg>

        {/* Top tag */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[9.5px] font-mono font-semibold uppercase tracking-wider text-foreground/60">
          <span className="size-1 rounded-full bg-emerald-500" />
          11 / 11 ACTIVE
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <motion.article
      variants={fadeUp}
      className="relative flex flex-col gap-2.5 rounded-2xl p-4 sm:p-5"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        className="flex size-10 items-center justify-center rounded-xl"
        style={{
          background: metric.iconBg,
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
        }}
      >
        <Icon
          className="size-[18px]"
          strokeWidth={2.4}
          style={{ color: metric.accent }}
        />
      </span>
      <h3 className="text-[14.5px] font-semibold tracking-tight text-foreground">
        {metric.name}
      </h3>
      <p className="text-[12.5px] leading-relaxed text-foreground/60">
        {metric.body}
      </p>
    </motion.article>
  );
}
