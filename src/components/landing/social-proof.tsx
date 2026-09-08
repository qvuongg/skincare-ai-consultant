"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Stat = {
  value: string;
  label: string;
  hint: string;
};

// Stats grounded in product-truth (technical claims, not fabricated user
// counts). Safe to ship before beta numbers exist.
const STATS: Stat[] = [
  {
    value: "11",
    label: "Chỉ số da đo lường",
    hint: "Từ độ ẩm tới quầng thâm — không thiếu một mục",
  },
  {
    value: "468",
    label: "Điểm mốc khuôn mặt",
    hint: "Bắt bằng AI Vision 3D theo thời gian thực",
  },
  {
    value: "~60s",
    label: "Mỗi lượt soi da",
    hint: "Bao gồm cả phân tích & lên routine",
  },
  {
    value: "0đ",
    label: "Luôn miễn phí",
    hint: "Không gate paywall, không bắt đăng ký",
  },
];

type Testimonial = {
  id: string;
  initials: string;
  meta: string;
  body: string;
  gradient: string;
};

// Placeholder beta-tester quotes — replace with real feedback before launch.
// First-name + city only so they read realistic without claiming specific
// identities. Tone leans Gen Z honest, not over-polished marketing.
const TESTIMONIALS: Testimonial[] = [
  {
    id: "lan",
    initials: "LA",
    meta: "Lan · 24 · Đà Nẵng",
    body: "Mình thích vì nó nói thẳng — da mình thiếu HA và đề xuất đúng cái mình hay quên. Không lòng vòng.",
    gradient:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
  },
  {
    id: "khoa",
    initials: "KH",
    meta: "Khoa · 27 · Hà Nội",
    body: "Mình ngại chăm da vì sợ phải mua 8 lọ. Mika gợi 3 sản phẩm, đúng ngân sách 500k. Mua xong là biết dùng luôn.",
    gradient:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(45,212,191,0.95))",
  },
  {
    id: "my",
    initials: "MY",
    meta: "My · 22 · TP.HCM",
    body: "Quét lại sau 3 tuần, điểm đỏ giảm rõ. Có cảm giác mình đang được theo dõi đúng nghĩa, không phải máy nói máy nghe.",
    gradient:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
  },
];

type Trust = {
  icon: LucideIcon;
  label: string;
  body: string;
};

const TRUSTS: Trust[] = [
  {
    icon: Lock,
    label: "Ảnh không lưu vĩnh viễn",
    body: "Hình quét chỉ tồn tại trong phiên xử lý, không upload nền tảng thứ 3.",
  },
  {
    icon: ShieldCheck,
    label: "Mã hóa HTTPS đầu cuối",
    body: "Mọi gói tin đi qua TLS — không sniff được trên đường truyền.",
  },
  {
    icon: Sparkles,
    label: "Không bán dữ liệu cho ai",
    body: "Không quảng cáo mục tiêu, không retarget, không trao đổi data với bên ngoài.",
  },
];

export function SocialProof() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-7xl"
      >
        <motion.div variants={fadeUp} className="mb-10 text-center sm:mb-12">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
            style={GLASS_LIGHT}
          >
            <span className="size-1.5 rounded-full bg-pink-500" />
            Tin được, vì có lý do
          </span>
          <h2 className="mt-4 text-balance text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Sòng phẳng từ con số tới quyền riêng tư.
          </h2>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
        >
          {STATS.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div variants={fadeUp} className="relative mt-10 sm:mt-12">
          {/* Mobile switcher pills */}
          <div className="mb-3 flex items-center justify-center gap-2 sm:hidden">
            {TESTIMONIALS.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTestimonial(idx)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
                style={{
                  background: activeTestimonial === idx ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.6)",
                  border: activeTestimonial === idx ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(255,255,255,0.8)",
                  color: activeTestimonial === idx ? "#000000" : "rgba(0,0,0,0.5)",
                }}
              >
                {t.meta.split(" · ")[0]}
              </button>
            ))}
          </div>

          {/* Mobile active single card */}
          <div className="sm:hidden">
            <TestimonialCard item={TESTIMONIALS[activeTestimonial]} />
          </div>

          {/* Desktop/Tablet 3-column row */}
          <div className="hidden grid-cols-3 gap-4 sm:grid">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} item={t} />
            ))}
          </div>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-center text-[11px] font-medium text-foreground/45"
          >
            *Phản hồi từ beta tester, lược trích và biên tập gọn. Mika đang trong
            giai đoạn mở rộng — cộng đồng và số liệu sẽ minh bạch theo thời gian.
          </motion.p>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          variants={fadeUp}
          className="mt-10 rounded-[1.75rem] p-5 sm:mt-12 sm:p-8"
          style={{ ...GLASS, ...GPU }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {TRUSTS.map((t) => (
              <TrustItem key={t.label} item={t} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative rounded-2xl p-5"
      style={{ ...GLASS, ...GPU }}
    >
      <p
        className="text-[34px] font-bold leading-none tracking-tight tabular-nums sm:text-[40px]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #a855f7 0%, #3b82f6 60%, #22c55e 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {stat.value}
      </p>
      <p className="mt-2 text-[13px] font-semibold text-foreground/80">
        {stat.label}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-foreground/55">
        {stat.hint}
      </p>
    </motion.div>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <motion.figure
      variants={fadeUp}
      className="relative flex flex-col gap-4 rounded-3xl p-6"
      style={{ ...GLASS, ...GPU }}
    >
      <Quote
        aria-hidden
        className="size-6 text-foreground/15"
        strokeWidth={2}
      />
      <blockquote className="flex-1 text-[14px] leading-relaxed text-foreground/80">
        “{item.body}”
      </blockquote>
      <figcaption className="flex items-center gap-3 pt-2">
        <span
          className="flex size-9 items-center justify-center text-[12px] font-bold text-white"
          style={{
            background: item.gradient,
            borderRadius: "10px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
          }}
        >
          {item.initials}
        </span>
        <span className="text-[12px] font-semibold tracking-tight text-foreground/65">
          {item.meta}
        </span>
      </figcaption>
    </motion.figure>
  );
}

function TrustItem({ item }: { item: Trust }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center text-white"
        style={{
          background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
          borderRadius: "10px",
          boxShadow:
            "0 8px 18px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      >
        <Icon className="size-[18px]" strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold tracking-tight text-foreground">
          {item.label}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/60">
          {item.body}
        </p>
      </div>
    </div>
  );
}
