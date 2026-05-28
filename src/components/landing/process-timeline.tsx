"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Camera,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { GPU, fadeUp, stagger } from "./landing-tokens";

// "Inside Mika" process section — intentionally rendered on a deep slate
// background to give the page a dark interlude between the light Hero and
// the rest of the white-glass sections. This breaks the all-glass-on-pastel
// monotony and gives a clear material rhythm: light → dark → light.

type Step = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  iconBg: string;
  glow: string;
  accent: string;
};

const STEPS: Step[] = [
  {
    id: "scan",
    icon: Camera,
    title: "Quét mặt 60 giây",
    body: "Chụp 3 góc — chính diện, trái, phải. AI tự bắt 468 điểm mốc khuôn mặt.",
    iconBg:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(168,85,247,0.45)",
    accent: "#a78bfa",
  },
  {
    id: "analyze",
    icon: Brain,
    title: "Phân tích sâu",
    body: "Đo 11 chỉ số da, đối chiếu với tuổi, môi trường, UV và lịch sinh hoạt của bạn.",
    iconBg:
      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(34,197,94,0.95))",
    glow: "rgba(59,130,246,0.45)",
    accent: "#60a5fa",
  },
  {
    id: "recommend",
    icon: Layers,
    title: "Đề xuất tinh gọn",
    body: "Routine sáng & tối cá nhân hóa, đúng ngân sách bạn đã đặt — không upsell.",
    iconBg:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(45,212,191,0.95))",
    glow: "rgba(34,197,94,0.45)",
    accent: "#34d399",
  },
  {
    id: "track",
    icon: TrendingUp,
    title: "Theo dõi tiến triển",
    body: "Quét lại định kỳ để so sánh tiến trình — xem da bạn cải thiện ở chỉ số nào.",
    iconBg:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
    glow: "rgba(245,158,11,0.45)",
    accent: "#fbbf24",
  },
];

export function ProcessTimeline() {
  return (
    <section className="relative px-6 py-20 lg:py-28">
      <DarkPanel>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto max-w-7xl"
        >
          <motion.div variants={fadeUp} className="mb-12 text-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Bên trong Mika
            </span>
            <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-white sm:text-[40px] lg:text-[48px]">
              Bốn bước.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Một làn da bạn hiểu rõ hơn.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-white/65 sm:text-[16px]">
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
                  "linear-gradient(180deg, rgba(168,85,247,0.55), rgba(96,165,250,0.45), rgba(52,211,153,0.45), rgba(251,191,36,0.45))",
              }}
            />
            <div className="grid grid-cols-1 gap-5">
              {STEPS.map((step, idx) => (
                <StepCardMobile key={step.id} step={step} index={idx} />
              ))}
            </div>
          </div>
        </motion.div>
      </DarkPanel>
    </section>
  );
}

// The slate-violet "scanner room" panel wrapping the whole section. Iris
// mesh blobs in the corners give it depth without going full-black.
function DarkPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        boxShadow:
          "0 60px 120px rgba(15,23,42,0.30), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] top-[5%] size-[55%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.40), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[20%] right-[5%] size-[60%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.32), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[20%] top-[40%] size-[35%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.20), transparent 70%)",
        }}
      />
      {/* Faint grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative">{children}</div>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-12 top-[3.25rem] h-px"
      style={{
        background:
          "linear-gradient(90deg, rgba(168,85,247,0.65), rgba(96,165,250,0.65), rgba(52,211,153,0.65), rgba(251,191,36,0.65))",
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    />
  );
}

// Glass-on-dark card. Note the much lower base opacity (0.06 vs 0.55) and
// the cooler border to read against a slate background.
const DARK_GLASS = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "0 24px 60px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
} as const;

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <motion.article
      variants={fadeUp}
      className="relative flex flex-col gap-4 rounded-3xl p-6"
      style={{ ...DARK_GLASS, ...GPU }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${step.accent}88, transparent)`,
        }}
      />

      <div className="flex items-center gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center text-white"
          style={{
            background: step.iconBg,
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: `0 12px 32px ${step.glow}, inset 0 1px 0 rgba(255,255,255,0.40)`,
          }}
        >
          <Icon className="size-5" strokeWidth={2.4} />
        </span>
        <span
          className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em]"
          style={{ color: step.accent }}
        >
          Bước {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[17px] font-semibold tracking-tight text-white">
          {step.title}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-white/65">
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
      className="relative flex items-start gap-4 rounded-3xl p-5"
      style={{ ...DARK_GLASS, ...GPU }}
    >
      <span
        className="relative z-10 flex size-12 shrink-0 items-center justify-center text-white"
        style={{
          background: step.iconBg,
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: `0 12px 28px ${step.glow}, inset 0 1px 0 rgba(255,255,255,0.40)`,
        }}
      >
        <Icon className="size-5" strokeWidth={2.4} />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em]"
          style={{ color: step.accent }}
        >
          Bước {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="text-[16px] font-semibold tracking-tight text-white">
          {step.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-white/65">
          {step.body}
        </p>
      </div>
    </motion.article>
  );
}
