"use client";

import { motion } from "framer-motion";
import {
  Check,
  CircleCheck,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Metric = {
  name: string;
  value: number;
  from: string;
  to: string;
};

const MOCK_METRICS: Metric[] = [
  { name: "Độ ẩm", value: 68, from: "#60a5fa", to: "#38bdf8" },
  { name: "Bã nhờn (cân bằng)", value: 52, from: "#fbbf24", to: "#f59e0b" },
  { name: "Lỗ chân lông", value: 71, from: "#a78bfa", to: "#8b5cf6" },
  { name: "Kết cấu", value: 64, from: "#34d399", to: "#10b981" },
];

type RoutineStep = {
  step: string;
  product: string;
  reason: string;
};

const MOCK_AM: RoutineStep[] = [
  { step: "1", product: "Sữa rửa mặt gel dịu nhẹ", reason: "pH thấp · giữ ẩm" },
  { step: "2", product: "Toner HA + Niacinamide 5%", reason: "đầy nước + làm dịu" },
  { step: "3", product: "Sunscreen SPF50 PA++++", reason: "UV Đà Nẵng đang ở 9" },
];
const MOCK_PM: RoutineStep[] = [
  { step: "1", product: "Cleansing oil dầu thực vật", reason: "rửa SPF tận gốc" },
  { step: "2", product: "Serum HA + Squalane", reason: "phục hồi ẩm qua đêm" },
  { step: "3", product: "Kem dưỡng có Ceramide", reason: "khóa hàng rào da" },
];

type Highlight = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: CircleCheck,
    title: "Một con số rõ ràng",
    body: "Skin Vitality Score 0–100. Bạn biết mình đang ở đâu, không cần đoán.",
  },
  {
    icon: CircleCheck,
    title: "11 chỉ số đầy đủ",
    body: "Mỗi chỉ số có điểm riêng, có hướng (tốt lên / xấu đi) và lời giải.",
  },
  {
    icon: CircleCheck,
    title: "Routine sáng + tối",
    body: "Đã sắp sẵn, đúng ngân sách bạn đặt. Có lý do cho từng bước.",
  },
  {
    icon: CircleCheck,
    title: "Quét lại để so sánh",
    body: "Sau 2–4 tuần, scan lại — Mika tự overlay tiến trình của bạn.",
  },
];

const SCORE = 76;

export function ReportPreview() {
  return (
    <section className="px-6 py-20 lg:py-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-7xl"
      >
        <motion.div variants={fadeUp} className="mb-12 text-center lg:text-left">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
            style={GLASS_LIGHT}
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Đây là cái bạn sẽ nhận
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Báo cáo da · trên một màn hình.
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px] lg:mx-0">
            Không cần đăng ký, không thêm ứng dụng. Bạn nhận đầy đủ điểm số,
            các chỉ số và routine sẵn dùng — ngay sau khi quét.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <motion.div variants={fadeUp} className="flex justify-center lg:order-1">
            <PhoneFrame />
          </motion.div>

          <motion.ul
            variants={stagger}
            className="space-y-4 lg:order-2"
          >
            {HIGHLIGHTS.map((h) => (
              <HighlightItem key={h.title} item={h} />
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}

function HighlightItem({ item }: { item: Highlight }) {
  const Icon = item.icon;
  return (
    <motion.li
      variants={fadeUp}
      className="relative flex items-start gap-4 rounded-2xl p-4 sm:p-5"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center text-white"
        style={{
          background: "linear-gradient(135deg, #a855f7, #3b82f6)",
          borderRadius: "10px",
          boxShadow:
            "0 8px 18px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <Icon className="size-[18px]" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {item.title}
        </h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/65">
          {item.body}
        </p>
      </div>
    </motion.li>
  );
}

// Static phone-shape frame containing a stylized version of the real
// ScoreReport. Not interactive — purely a visual preview of the deliverable.
function PhoneFrame() {
  return (
    <div
      className="relative w-full max-w-[340px] rounded-[2.25rem] p-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))",
        boxShadow:
          "0 50px 100px rgba(31,38,135,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
        ...GPU,
      }}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-3.5 z-10 flex h-5 -translate-x-1/2 items-center gap-1 rounded-full bg-black px-3">
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="size-1.5 rounded-full bg-zinc-800" />
      </div>

      <div
        className="relative overflow-hidden rounded-[1.85rem] px-4 pb-5 pt-8"
        style={{
          background:
            "linear-gradient(180deg, #fbf7ff 0%, #f3f7ff 60%, #f0fbf6 100%)",
        }}
      >
        {/* Top status bar */}
        <div className="mb-4 flex items-center justify-between text-[10px] font-semibold text-foreground/45">
          <span>09:42</span>
          <span>Báo cáo da · Hôm nay</span>
        </div>

        {/* Score block */}
        <div
          className="relative rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 12px 28px rgba(31,38,135,0.10)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                Skin Vitality Score
              </p>
              <p
                className="mt-1 text-[40px] font-bold leading-none tabular-nums"
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {SCORE}
                <span className="text-[18px] font-semibold text-foreground/50">
                  /100
                </span>
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: "#15803d",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              Khá
            </span>
          </div>

          {/* Metric mini-bars */}
          <ul className="mt-4 space-y-2.5">
            {MOCK_METRICS.map((m) => (
              <li key={m.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-foreground/70">
                  <span>{m.name}</span>
                  <span className="tabular-nums text-foreground/55">
                    {m.value}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.value}%`,
                      background: `linear-gradient(90deg, ${m.from}, ${m.to})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Routine block */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <RoutineMini
            label="Sáng"
            icon={Sun}
            tint="rgba(251,191,36,0.16)"
            iconColor="#d97706"
            steps={MOCK_AM}
          />
          <RoutineMini
            label="Tối"
            icon={Moon}
            tint="rgba(99,102,241,0.16)"
            iconColor="#4f46e5"
            steps={MOCK_PM}
          />
        </div>

        {/* Tip strip */}
        <div
          className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.10), rgba(59,130,246,0.10))",
            border: "1px solid rgba(168,85,247,0.20)",
          }}
        >
          <Check
            className="mt-0.5 size-3.5 shrink-0 text-purple-600"
            strokeWidth={2.6}
          />
          <p className="text-[11px] leading-snug text-foreground/70">
            <span className="font-semibold text-foreground/85">Tip:</span>{" "}
            Da bạn còn hụt ẩm 32 điểm — bổ sung HA serum bước 2 buổi tối.
          </p>
        </div>
      </div>
    </div>
  );
}

function RoutineMini({
  label,
  icon: Icon,
  tint,
  iconColor,
  steps,
}: {
  label: string;
  icon: LucideIcon;
  tint: string;
  iconColor: string;
  steps: RoutineStep[];
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 8px 20px rgba(31,38,135,0.08)",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="flex size-6 items-center justify-center rounded-md"
          style={{ background: tint }}
        >
          <Icon
            className="size-3.5"
            strokeWidth={2.6}
            style={{ color: iconColor }}
          />
        </span>
        <span className="text-[11px] font-semibold text-foreground/75">
          {label}
        </span>
      </div>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.step} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-[9px] font-semibold text-foreground/40">
              {s.step}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10.5px] font-medium leading-tight text-foreground/80">
                {s.product}
              </p>
              <p className="text-[9px] leading-tight text-foreground/50">
                {s.reason}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
