"use client";

import { motion } from "framer-motion";
import {
  Check,
  CircleCheck,
  Moon,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Metric = {
  name: string;
  value: number;
  from: string;
  to: string;
};

const PROFILES = {
  initial: {
    label: "Tuần 0 · Khởi đầu",
    score: 68,
    grade: "Cần phục hồi",
    gradeColor: "#f59e0b",
    gradeBg: "rgba(245,158,11,0.12)",
    gradeBorder: "rgba(245,158,11,0.30)",
    metrics: [
      { name: "Độ ẩm tầng sâu", value: 48, from: "#ef4444", to: "#f59e0b" },
      { name: "Cân bằng bã nhờn", value: 52, from: "#f59e0b", to: "#eab308" },
      { name: "Thu nhỏ lỗ chân lông", value: 58, from: "#a855f7", to: "#8b5cf6" },
      { name: "Độ khỏe rào cản da", value: 54, from: "#3b82f6", to: "#60a5fa" },
    ],
    tip: "Hụt ẩm 52 điểm & tuyến dầu bù ẩm quá mức — bổ sung HA serum bước 2 buổi tối.",
  },
  improved: {
    label: "Tuần 4 · Phục hồi",
    score: 86,
    grade: "Rất tốt",
    gradeColor: "#15803d",
    gradeBg: "rgba(34,197,94,0.12)",
    gradeBorder: "rgba(34,197,94,0.25)",
    metrics: [
      { name: "Độ ẩm tầng sâu", value: 84, from: "#38bdf8", to: "#3b82f6" },
      { name: "Cân bằng bã nhờn", value: 80, from: "#10b981", to: "#059669" },
      { name: "Thu nhỏ lỗ chân lông", value: 82, from: "#a855f7", to: "#8b5cf6" },
      { name: "Độ khỏe rào cản da", value: 89, from: "#22c55e", to: "#15803d" },
    ],
    tip: "Hàng rào sừng đã ổn định 89% — duy trì khóa ẩm Ceramide và chống nắng SPF50+.",
  },
};

type RoutineStep = {
  step: string;
  product: string;
  reason: string;
};

const MOCK_AM: RoutineStep[] = [
  { step: "1", product: "Sữa rửa mặt pH 5.5 dịu nhẹ", reason: "pH chuẩn · giữ ẩm tự nhiên" },
  { step: "2", product: "Toner HA + Niacinamide 5%", reason: "ngậm nước + dịu ửng đỏ" },
  { step: "3", product: "Sunscreen SPF50+ PA++++", reason: "chống tia UV & ánh sáng xanh" },
];
const MOCK_PM: RoutineStep[] = [
  { step: "1", product: "Dầu tẩy trang nhũ hóa sâu", reason: "rửa sạch SPF & bã nhờn" },
  { step: "2", product: "Serum HA + Vitamin B5", reason: "hồi phục tế bào ban đêm" },
  { step: "3", product: "Kem khóa ẩm 3x Ceramide", reason: "khóa nước tầng sừng 24h" },
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
    body: "Skin Vitality Score 0–100. Bạn biết mình đang ở đâu, không cần đoán mò.",
  },
  {
    icon: CircleCheck,
    title: "11 chỉ số toàn diện",
    body: "Mỗi chỉ số có điểm riêng, biểu đồ tiến trình và giải thích sinh học.",
  },
  {
    icon: CircleCheck,
    title: "Routine AM/PM tinh gọn",
    body: "Đã sắp xếp đúng thứ tự, 100% đúng ngân sách đã chọn — không ép mua.",
  },
  {
    icon: CircleCheck,
    title: "Đối chiếu sau 2–4 tuần",
    body: "Quét lại định kỳ — Mika tự overlay biểu đồ tiến trình để kiểm chứng.",
  },
];

export function ReportPreview() {
  const [profileKey, setProfileKey] = useState<"initial" | "improved">("improved");
  const [viewTab, setViewTab] = useState<"overview" | "am" | "pm">("overview");

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-7xl"
      >
        <motion.div variants={fadeUp} className="mb-10 text-center lg:text-left sm:mb-12">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
            style={GLASS_LIGHT}
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Đây là cái bạn sẽ nhận
          </span>
          <h2 className="mt-4 text-balance text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Báo cáo da · trên một màn hình.
          </h2>
          <p className="mx-auto mt-3 max-w-[60ch] text-pretty text-[14px] leading-relaxed text-foreground/65 sm:mt-4 sm:text-[16px] lg:mx-0">
            Không cần đăng ký, không thêm ứng dụng. Bạn nhận đầy đủ điểm số,
            các chỉ số sinh học và routine sẵn dùng — ngay sau khi quét.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <motion.div variants={fadeUp} className="flex justify-center lg:order-1">
            <InteractivePhoneFrame
              profileKey={profileKey}
              onProfileChange={setProfileKey}
              viewTab={viewTab}
              onViewTabChange={setViewTab}
            />
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-1 lg:space-y-4 lg:gap-0 lg:order-2"
          >
            {HIGHLIGHTS.map((h) => (
              <HighlightItem key={h.title} item={h} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function HighlightItem({ item }: { item: Highlight }) {
  const Icon = item.icon;
  return (
    <motion.div
      variants={fadeUp}
      className="relative flex flex-col items-start gap-2.5 rounded-2xl p-3.5 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
      style={{ ...GLASS, ...GPU }}
    >
      <span
        className="flex size-8 sm:size-9 shrink-0 items-center justify-center text-white"
        style={{
          background: "linear-gradient(135deg, #a855f7, #3b82f6)",
          borderRadius: "10px",
          boxShadow:
            "0 8px 18px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <Icon className="size-4 sm:size-[18px]" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13.5px] font-semibold tracking-tight text-foreground sm:text-[15px]">
          {item.title}
        </h3>
        <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/65 sm:mt-1 sm:text-[13.5px]">
          {item.body}
        </p>
      </div>
    </motion.div>
  );
}

// Interactive phone-shape frame simulating real ScoreReport deliverables
function InteractivePhoneFrame({
  profileKey,
  onProfileChange,
  viewTab,
  onViewTabChange,
}: {
  profileKey: "initial" | "improved";
  onProfileChange: (k: "initial" | "improved") => void;
  viewTab: "overview" | "am" | "pm";
  onViewTabChange: (t: "overview" | "am" | "pm") => void;
}) {
  const currentProfile = PROFILES[profileKey];

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
        className="relative overflow-hidden rounded-[1.85rem] px-3.5 pb-4 pt-7"
        style={{
          background:
            "linear-gradient(180deg, #fbf7ff 0%, #f3f7ff 60%, #f0fbf6 100%)",
        }}
      >
        {/* Top status bar */}
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-foreground/45">
          <span>09:42</span>
          <span>Báo cáo da · AI Vision</span>
        </div>

        {/* Profile Switcher Pills */}
        <div className="mb-3 flex gap-1 rounded-xl bg-black/5 p-1">
          <button
            type="button"
            onClick={() => onProfileChange("initial")}
            className="flex-1 rounded-lg py-1 text-center text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: profileKey === "initial" ? "#ffffff" : "transparent",
              color: profileKey === "initial" ? "#d97706" : "rgba(0,0,0,0.5)",
              boxShadow: profileKey === "initial" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Tuần 0 (Điểm 68)
          </button>
          <button
            type="button"
            onClick={() => onProfileChange("improved")}
            className="flex-1 rounded-lg py-1 text-center text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: profileKey === "improved" ? "#ffffff" : "transparent",
              color: profileKey === "improved" ? "#15803d" : "rgba(0,0,0,0.5)",
              boxShadow: profileKey === "improved" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Tuần 4 (Điểm 86)
          </button>
        </div>

        {/* View Switcher Sub-tabs */}
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-black/5 p-0.5">
          <button
            type="button"
            onClick={() => onViewTabChange("overview")}
            className="rounded-lg py-1 text-center text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: viewTab === "overview" ? "#ffffff" : "transparent",
              color: viewTab === "overview" ? "#7c3aed" : "rgba(0,0,0,0.55)",
              boxShadow: viewTab === "overview" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Chỉ số da
          </button>
          <button
            type="button"
            onClick={() => onViewTabChange("am")}
            className="rounded-lg py-1 text-center text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: viewTab === "am" ? "#ffffff" : "transparent",
              color: viewTab === "am" ? "#d97706" : "rgba(0,0,0,0.55)",
              boxShadow: viewTab === "am" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Sáng (AM)
          </button>
          <button
            type="button"
            onClick={() => onViewTabChange("pm")}
            className="rounded-lg py-1 text-center text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: viewTab === "pm" ? "#ffffff" : "transparent",
              color: viewTab === "pm" ? "#4f46e5" : "rgba(0,0,0,0.55)",
              boxShadow: viewTab === "pm" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Tối (PM)
          </button>
        </div>

        {/* View Tab Content: OVERVIEW */}
        {viewTab === "overview" && (
          <motion.div
            key="tab-overview"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Score block */}
            <div
              className="relative rounded-2xl p-3.5"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 12px 28px rgba(31,38,135,0.08)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                    Skin Vitality Score
                  </p>
                  <p
                    className="mt-0.5 text-[38px] font-bold leading-none tabular-nums"
                    style={{
                      backgroundImage:
                        profileKey === "improved"
                          ? "linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)"
                          : "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {currentProfile.score}
                    <span className="text-[16px] font-semibold text-foreground/45">
                      /100
                    </span>
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: currentProfile.gradeColor,
                    background: currentProfile.gradeBg,
                    border: `1px solid ${currentProfile.gradeBorder}`,
                  }}
                >
                  {currentProfile.grade}
                </span>
              </div>

              {/* Metric mini-bars */}
              <ul className="mt-3.5 space-y-2">
                {currentProfile.metrics.map((m) => (
                  <li key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-medium text-foreground/75">
                      <span>{m.name}</span>
                      <span className="font-mono tabular-nums text-foreground/60">
                        {m.value}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{
                          background: `linear-gradient(90deg, ${m.from}, ${m.to})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tip strip */}
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168,85,247,0.10), rgba(59,130,246,0.10))",
                border: "1px solid rgba(168,85,247,0.20)",
              }}
            >
              <Sparkles
                className="mt-0.5 size-3.5 shrink-0 text-purple-600"
                strokeWidth={2.4}
              />
              <p className="text-[10.5px] leading-snug text-foreground/75">
                <span className="font-semibold text-foreground/90">AI Note:</span>{" "}
                {currentProfile.tip}
              </p>
            </div>
          </motion.div>
        )}

        {/* View Tab Content: AM ROUTINE */}
        {viewTab === "am" && (
          <motion.div
            key="tab-am"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
              <span className="flex items-center gap-1.5">
                <Sun className="size-3.5 text-amber-600" />
                Routine Buổi Sáng
              </span>
              <span className="text-[10px] font-normal text-amber-700">3 bước</span>
            </div>

            <ul className="space-y-1.5">
              {MOCK_AM.map((s) => (
                <li
                  key={s.step}
                  className="rounded-xl p-2.5"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(255,255,255,0.9)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-700">
                      {s.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-foreground/85">
                        {s.product}
                      </p>
                      <p className="text-[9.5px] text-foreground/55">
                        {s.reason}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-amber-200/60 bg-white/60 p-2.5 text-[10px] text-foreground/70">
              ☀️ <strong className="text-foreground/90">Chỉ số UV:</strong> 9.2 (Rất cao) · Khuyên dùng kem chống nắng phổ rộng quang học.
            </div>
          </motion.div>
        )}

        {/* View Tab Content: PM ROUTINE */}
        {viewTab === "pm" && (
          <motion.div
            key="tab-pm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-800">
              <span className="flex items-center gap-1.5">
                <Moon className="size-3.5 text-indigo-600" />
                Routine Buổi Tối
              </span>
              <span className="text-[10px] font-normal text-indigo-700">Phục hồi sâu</span>
            </div>

            <ul className="space-y-1.5">
              {MOCK_PM.map((s) => (
                <li
                  key={s.step}
                  className="rounded-xl p-2.5"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(255,255,255,0.9)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-bold text-indigo-700">
                      {s.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-foreground/85">
                        {s.product}
                      </p>
                      <p className="text-[9.5px] text-foreground/55">
                        {s.reason}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-indigo-200/60 bg-white/60 p-2.5 text-[10px] text-foreground/70">
              🌙 <strong className="text-foreground/90">Ban đêm:</strong> Tốc độ phân bào tầng sừng đạt đỉnh lúc 23:00 - 03:00 sáng.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
