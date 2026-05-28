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

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Metric = {
  id: string;
  icon: LucideIcon;
  name: string;
  body: string;
  iconBg: string;
  iconColor: string;
};

// Aligned 1:1 with the 11 numeric fields in src/lib/scoring/engine.ts
// (aiMetricsSchema). The order matches the schema for reviewer cross-check.
const METRICS: Metric[] = [
  {
    id: "hydration",
    icon: Droplet,
    name: "Độ ẩm",
    body: "Mức nước giữ lại trong lớp sừng. Thấp = da khô, căng, bong.",
    iconBg: "rgba(59,130,246,0.14)",
    iconColor: "#3b82f6",
  },
  {
    id: "sebum",
    icon: Droplets,
    name: "Bã nhờn",
    body: "Cân bằng dầu tự nhiên. Quá ít = da khô, quá nhiều = bóng dầu.",
    iconBg: "rgba(245,158,11,0.14)",
    iconColor: "#d97706",
  },
  {
    id: "acne",
    icon: CircleDot,
    name: "Mụn viêm",
    body: "Số lượng & mức độ viêm của mụn đỏ, mụn mủ, nốt sần đang hoạt động.",
    iconBg: "rgba(239,68,68,0.14)",
    iconColor: "#ef4444",
  },
  {
    id: "pore",
    icon: Aperture,
    name: "Lỗ chân lông",
    body: "Độ giãn nở của lỗ chân lông — phản ánh độ thông thoáng, tăng tiết dầu.",
    iconBg: "rgba(168,85,247,0.14)",
    iconColor: "#9333ea",
  },
  {
    id: "pigmentation",
    icon: Palette,
    name: "Sắc tố",
    body: "Đốm nâu, vết thâm sau mụn, nám — vùng tăng melanin cục bộ.",
    iconBg: "rgba(217,119,6,0.14)",
    iconColor: "#b45309",
  },
  {
    id: "wrinkle",
    icon: Waves,
    name: "Nếp nhăn",
    body: "Đường li ti, nếp gấp động & nếp tĩnh. Tăng dần theo collagen.",
    iconBg: "rgba(100,116,139,0.14)",
    iconColor: "#475569",
  },
  {
    id: "tone",
    icon: Sun,
    name: "Đều màu",
    body: "Mức độ đồng nhất tổng thể giữa các vùng má, trán, cằm và mũi.",
    iconBg: "rgba(251,146,60,0.14)",
    iconColor: "#ea580c",
  },
  {
    id: "redness",
    icon: Flame,
    name: "Đỏ da",
    body: "Vùng kích ứng, mao mạch giãn — chỉ báo da đang bị tổn thương hàng rào.",
    iconBg: "rgba(244,63,94,0.14)",
    iconColor: "#e11d48",
  },
  {
    id: "texture",
    icon: Layers,
    name: "Kết cấu",
    body: "Độ mịn của bề mặt da. Đo dộ gồ ghề từ mụn, sẹo, vảy bong.",
    iconBg: "rgba(20,184,166,0.14)",
    iconColor: "#0d9488",
  },
  {
    id: "dark_circles",
    icon: Eye,
    name: "Quầng thâm",
    body: "Sắc tố và mạch máu vùng quanh mắt — phản ánh giấc ngủ, di truyền.",
    iconBg: "rgba(99,102,241,0.14)",
    iconColor: "#4f46e5",
  },
  {
    id: "blackheads",
    icon: Asterisk,
    name: "Mụn đầu đen",
    body: "Bã nhờn oxy hóa trong lỗ chân lông. Tập trung quanh vùng chữ T.",
    iconBg: "rgba(71,85,105,0.14)",
    iconColor: "#334155",
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
          style={{ color: metric.iconColor }}
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
