"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Camera,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

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
  tags: string[];
};

const STEPS: Step[] = [
  {
    id: "scan",
    icon: Camera,
    title: "Quét mặt 60 giây",
    body: "Chụp 3 góc — chính diện, trái, phải. AI tự bắt 468 điểm mốc khuôn mặt theo thời gian thực.",
    iconBg:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(168,85,247,0.45)",
    accent: "#a78bfa",
    tags: ["468 Điểm mốc 3D", "Chụp 3 góc", "Không lưu ảnh"],
  },
  {
    id: "analyze",
    icon: Brain,
    title: "Phân tích sâu",
    body: "Đo 11 chỉ số da liễu, đối chiếu với tuổi sinh học, môi trường, chỉ số UV và lịch sinh hoạt.",
    iconBg:
      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(34,197,94,0.95))",
    glow: "rgba(59,130,246,0.45)",
    accent: "#60a5fa",
    tags: ["11 Biomarkers", "Đối chiếu UV & ẩm", "AI da liễu"],
  },
  {
    id: "recommend",
    icon: Layers,
    title: "Đề xuất tinh gọn",
    body: "Routine sáng & tối cá nhân hóa, đúng ngân sách bạn đã đặt — chỉ giữ các hoạt chất da thực sự cần.",
    iconBg:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(45,212,191,0.95))",
    glow: "rgba(34,197,94,0.45)",
    accent: "#34d399",
    tags: ["Routine AM/PM", "Đúng ngân sách", "Không upsell"],
  },
  {
    id: "track",
    icon: TrendingUp,
    title: "Theo dõi tiến triển",
    body: "Quét lại định kỳ sau 2–4 tuần để đối chiếu delta — xem rõ các chỉ số đã hồi phục ra sao.",
    iconBg:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
    glow: "rgba(245,158,11,0.45)",
    accent: "#fbbf24",
    tags: ["Chu kỳ 2–4 tuần", "Biểu đồ delta", "Đo độ phục hồi"],
  },
];

export function ProcessTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <DarkPanel>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto max-w-7xl"
        >
          <motion.div variants={fadeUp} className="mb-10 text-center sm:mb-12">
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
            <h2 className="mt-4 text-balance text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[40px] lg:text-[48px]">
              Bốn bước.{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Một làn da bạn hiểu rõ hơn.
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-[58ch] text-pretty text-[14px] leading-relaxed text-white/65 sm:mt-4 sm:text-[16px]">
              Không cần app, không cần đăng ký. Chỉ camera điện thoại và một
              phút của bạn — Mika lo phần còn lại.
            </p>
          </motion.div>

          {/* Desktop: 4-column row with connector underlay */}
          <div className="relative hidden lg:block">
            <ConnectorLine />
            <div className="relative grid grid-cols-4 gap-6">
              {STEPS.map((step, idx) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={idx}
                  isSelected={activeStep === idx}
                  onClick={() => setActiveStep(idx)}
                />
              ))}
            </div>
          </div>

          {/* Mobile/tablet: Co-Located Interactive Step Cockpit (Zero scroll fatigue) */}
          <div className="relative lg:hidden">
            {/* Step selector pills */}
            <div className="mb-4 flex items-center justify-between gap-1.5 rounded-2xl p-1.5" style={DARK_GLASS}>
              {STEPS.map((step, idx) => {
                const isCurrent = activeStep === idx;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 px-1 text-center transition-all"
                    style={{
                      background: isCurrent ? "rgba(255,255,255,0.12)" : "transparent",
                      border: isCurrent ? `1px solid ${step.accent}80` : "1px solid transparent",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold tracking-wider"
                      style={{ color: isCurrent ? step.accent : "rgba(255,255,255,0.4)" }}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className="truncate text-[11px] font-semibold"
                      style={{ color: isCurrent ? "#ffffff" : "rgba(255,255,255,0.6)" }}
                    >
                      {step.title.split(" ")[0]}
                    </span>
                    {isCurrent && (
                      <motion.div
                        layoutId="activeStepIndicator"
                        className="absolute -bottom-1 h-0.5 w-6 rounded-full"
                        style={{ background: step.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Step Cockpit Card */}
            <StepCockpitMobile
              step={STEPS[activeStep]}
              index={activeStep}
              totalSteps={STEPS.length}
              onPrev={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : STEPS.length - 1))}
              onNext={() => setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : 0))}
            />
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
      className="relative overflow-hidden rounded-[2rem] px-4 py-10 sm:rounded-[2.5rem] sm:px-10 lg:px-16 lg:py-24"
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

function StepCard({
  step,
  index,
  isSelected,
  onClick,
}: {
  step: Step;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  return (
    <motion.article
      variants={fadeUp}
      onClick={onClick}
      className={`group relative flex cursor-pointer flex-col gap-4 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] ${
        isSelected ? "ring-1 ring-white/30" : ""
      }`}
      style={{
        ...DARK_GLASS,
        ...GPU,
        background: isSelected
          ? "rgba(255,255,255,0.09)"
          : "rgba(255,255,255,0.05)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${step.accent}${isSelected ? "cc" : "66"}, transparent)`,
        }}
      />

      <div className="flex items-center justify-between">
        <span
          className="flex size-12 shrink-0 items-center justify-center text-white transition-transform group-hover:scale-110"
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

      {/* High-tech tags */}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {step.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white/60"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

function StepCockpitMobile({
  step,
  index,
  totalSteps,
  onPrev,
  onNext,
}: {
  step: Step;
  index: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const Icon = step.icon;

  return (
    <motion.article
      key={step.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col gap-4 rounded-3xl p-5"
      style={{ ...DARK_GLASS, ...GPU }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="relative z-10 flex size-11 shrink-0 items-center justify-center text-white"
            style={{
              background: step.iconBg,
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: `0 10px 24px ${step.glow}, inset 0 1px 0 rgba(255,255,255,0.40)`,
            }}
          >
            <Icon className="size-5" strokeWidth={2.4} />
          </span>
          <div>
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: step.accent }}
            >
              Bước {String(index + 1).padStart(2, "0")} / 0{totalSteps}
            </span>
            <h3 className="text-[17px] font-semibold tracking-tight text-white">
              {step.title}
            </h3>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white/70"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Sparkles className="size-2.5 text-emerald-400" />
          AI Bio-Tech
        </span>
      </div>

      <p className="text-[13.5px] leading-relaxed text-white/75">
        {step.body}
      </p>

      {/* High-tech tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {step.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-white/80"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${step.accent}40`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stepper Navigation Bar */}
      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:text-white"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ChevronLeft className="size-3.5" />
          Trước
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, dotIdx) => (
            <span
              key={dotIdx}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: dotIdx === index ? "18px" : "6px",
                background: dotIdx === index ? step.accent : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: `1px solid ${step.accent}80`,
          }}
        >
          Tiếp theo
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </motion.article>
  );
}
