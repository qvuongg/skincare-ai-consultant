"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Camera,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  GLASS,
  GLASS_LIGHT,
  GPU,
  fadeUp,
  stagger,
} from "./landing-tokens";

type Step = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  iconBg: string;
  glow: string;
};

const STEPS: Step[] = [
  {
    id: "scan",
    icon: Camera,
    title: "Quét mặt 60 giây",
    body: "Chụp 3 góc — chính diện, trái, phải. AI tự bắt 468 điểm mốc khuôn mặt.",
    iconBg:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(168,85,247,0.40)",
  },
  {
    id: "analyze",
    icon: Brain,
    title: "Phân tích sâu",
    body: "Đo 11 chỉ số da, đối chiếu với tuổi, môi trường, UV và lịch sinh hoạt của bạn.",
    iconBg:
      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(34,197,94,0.95))",
    glow: "rgba(59,130,246,0.40)",
  },
  {
    id: "recommend",
    icon: Layers,
    title: "Đề xuất tinh gọn",
    body: "Routine sáng & tối cá nhân hóa, đúng ngân sách bạn đã đặt — không upsell.",
    iconBg:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(45,212,191,0.95))",
    glow: "rgba(34,197,94,0.40)",
  },
  {
    id: "track",
    icon: TrendingUp,
    title: "Theo dõi tiến triển",
    body: "Quét lại định kỳ để so sánh tiến trình — xem da bạn cải thiện ở chỉ số nào.",
    iconBg:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
    glow: "rgba(245,158,11,0.40)",
  },
];

export function ProcessTimeline() {
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
            <span className="size-1.5 rounded-full bg-blue-500" />
            Bên trong Mika
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Bốn bước. Một làn da bạn hiểu rõ hơn.
          </h2>
          <p className="mx-auto mt-4 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
            Không cần app, không cần đăng ký. Chỉ camera điện thoại và một
            phút của bạn — Mika lo phần còn lại.
          </p>
        </motion.div>

        {/* Desktop: 4-column row with connector underlay */}
        <div className="relative hidden lg:block">
          <ConnectorLine />
          <div className="relative grid grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <StepCard key={step.id} step={step} index={idx} />
            ))}
          </div>
        </div>

        {/* Mobile/tablet: vertical stack with left-side connector */}
        <div className="relative lg:hidden">
          <div
            aria-hidden
            className="absolute bottom-6 left-[1.85rem] top-6 w-px"
            style={{
              background:
                "linear-gradient(180deg, rgba(168,85,247,0.45), rgba(59,130,246,0.30), rgba(34,197,94,0.30), rgba(245,158,11,0.30))",
            }}
          />
          <div className="grid grid-cols-1 gap-5">
            {STEPS.map((step, idx) => (
              <StepCardMobile key={step.id} step={step} index={idx} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// Horizontal dotted line behind the desktop step cards. Sits at the icon's
// vertical center (~3.25rem from card top) so the bullets feel connected.
function ConnectorLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-12 top-[3.25rem] h-px"
      style={{
        background:
          "linear-gradient(90deg, rgba(168,85,247,0.45), rgba(59,130,246,0.45), rgba(34,197,94,0.45), rgba(245,158,11,0.45))",
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    />
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <motion.article
      variants={fadeUp}
      className="relative flex flex-col gap-4 rounded-3xl p-6"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      <div className="flex items-center gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center text-white"
          style={{
            background: step.iconBg,
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: `0 12px 28px ${step.glow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
          }}
        >
          <Icon className="size-5" strokeWidth={2.4} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          Bước {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
          {step.title}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-foreground/65">
          {step.body}
        </p>
      </div>
    </motion.article>
  );
}

function StepCardMobile({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <motion.article
      variants={fadeUp}
      className="relative flex items-start gap-4 rounded-3xl p-5 pl-5"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        className="relative z-10 flex size-12 shrink-0 items-center justify-center text-white"
        style={{
          background: step.iconBg,
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: `0 12px 28px ${step.glow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
        }}
      >
        <Icon className="size-5" strokeWidth={2.4} />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          Bước {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
          {step.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-foreground/65">
          {step.body}
        </p>
      </div>
    </motion.article>
  );
}
