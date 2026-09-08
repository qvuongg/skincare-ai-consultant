"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplet, Droplets, CircleDot, Palette, Sparkles, Zap } from "lucide-react";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

type Macro = {
  id: string;
  label: string;
  metric: string;
  body: string;
  insight: string;
  background: string;
  hotspots?: Array<{ x: string; y: string; color: string; size: number }>;
  imageSrc?: string;
};

const MACROS: Macro[] = [
  {
    id: "dry",
    label: "Da khô",
    metric: "Độ ẩm 32",
    body: "Bề mặt mất nước, viền tế bào sừng bong nhẹ. AI thấy được các vi nứt mà gương soi bỏ qua.",
    insight: "Phát hiện mạng lưới rãnh nứt tế bào tầng sừng do thiếu NMF. Cần cấp ẩm HA đa tầng và khóa màng bằng Ceramide.",
    background: [
      "radial-gradient(circle at 25% 30%, rgba(180,140,100,0.35), transparent 35%)",
      "radial-gradient(circle at 70% 55%, rgba(160,120,90,0.30), transparent 40%)",
      "radial-gradient(circle at 50% 80%, rgba(200,160,120,0.25), transparent 35%)",
      "radial-gradient(ellipse at 40% 50%, rgba(255,235,210,0.50), transparent 60%)",
      "linear-gradient(135deg, #f4e6d3 0%, #e8d4b8 100%)",
    ].join(", "),
    hotspots: [
      { x: "22%", y: "35%", color: "#92400e", size: 6 },
      { x: "60%", y: "60%", color: "#a16207", size: 5 },
      { x: "75%", y: "30%", color: "#92400e", size: 4 },
    ],
  },
  {
    id: "oily",
    label: "Da dầu",
    metric: "Bã nhờn 78",
    body: "Bề mặt sáng bóng do tuyến nhờn hoạt động mạnh. Phản chiếu ánh sáng theo từng vùng chữ T.",
    insight: "Khúc xạ ánh sáng biểu bì ghi nhận dầu thừa tích tụ tại nang lông. Cần Niacinamide 5% điều tiết lipid tự nhiên.",
    background: [
      "radial-gradient(circle at 35% 40%, rgba(255,255,255,0.55), transparent 25%)",
      "radial-gradient(circle at 65% 35%, rgba(255,255,255,0.45), transparent 25%)",
      "radial-gradient(circle at 50% 65%, rgba(255,255,255,0.35), transparent 30%)",
      "radial-gradient(circle at 20% 70%, rgba(255,250,210,0.40), transparent 40%)",
      "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
    ].join(", "),
    hotspots: [
      { x: "35%", y: "42%", color: "#fef3c7", size: 8 },
      { x: "65%", y: "38%", color: "#fef3c7", size: 7 },
      { x: "50%", y: "68%", color: "#fef3c7", size: 6 },
    ],
  },
  {
    id: "acne",
    label: "Da mụn",
    metric: "Mụn viêm 64",
    body: "Các điểm viêm đỏ rải rác kèm vùng quanh sưng nhẹ. AI đếm và phân loại theo độ nặng.",
    insight: "Phát hiện 64 ổ phản ứng viêm xung quanh nang lông do vi khuẩn P.acnes. Cần Salicylic 1% kháng viêm dịu nhẹ.",
    background: [
      "radial-gradient(circle at 30% 35%, rgba(190,18,60,0.55), transparent 8%)",
      "radial-gradient(circle at 55% 55%, rgba(220,38,38,0.60), transparent 7%)",
      "radial-gradient(circle at 75% 30%, rgba(190,18,60,0.50), transparent 6%)",
      "radial-gradient(circle at 25% 70%, rgba(220,38,38,0.45), transparent 8%)",
      "radial-gradient(circle at 60% 80%, rgba(190,18,60,0.40), transparent 7%)",
      "radial-gradient(ellipse at 50% 50%, rgba(252,205,213,0.50), transparent 70%)",
      "linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)",
    ].join(", "),
    hotspots: [
      { x: "30%", y: "35%", color: "#be123c", size: 10 },
      { x: "55%", y: "55%", color: "#dc2626", size: 12 },
      { x: "75%", y: "30%", color: "#be123c", size: 9 },
      { x: "25%", y: "70%", color: "#dc2626", size: 11 },
      { x: "60%", y: "80%", color: "#be123c", size: 8 },
    ],
  },
  {
    id: "pigment",
    label: "Sắc tố",
    metric: "Pigmentation 71",
    body: "Đám tăng sắc tố melanin không đều — thâm sau mụn, nám, đốm nâu. AI phân biệt từng loại.",
    insight: "Mật độ hắc sắc tố Melanin phân bổ không đồng nhất dưới lớp đáy. Cần bảo vệ quang học và Tranexamic Acid làm đều màu.",
    background: [
      "radial-gradient(ellipse at 25% 35%, rgba(120,53,15,0.50), transparent 18%)",
      "radial-gradient(ellipse at 65% 30%, rgba(146,64,14,0.45), transparent 20%)",
      "radial-gradient(circle at 55% 65%, rgba(180,83,9,0.40), transparent 22%)",
      "radial-gradient(circle at 30% 70%, rgba(120,53,15,0.45), transparent 18%)",
      "radial-gradient(circle at 80% 60%, rgba(146,64,14,0.35), transparent 20%)",
      "linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)",
    ].join(", "),
    hotspots: [
      { x: "25%", y: "35%", color: "#78350f", size: 11 },
      { x: "65%", y: "30%", color: "#92400e", size: 10 },
      { x: "55%", y: "65%", color: "#b45309", size: 12 },
      { x: "30%", y: "70%", color: "#78350f", size: 9 },
    ],
  },
];

export function SkinMacro() {
  const [selectedId, setSelectedId] = useState<string>("acne");
  const selectedMacro = MACROS.find((m) => m.id === selectedId) || MACROS[0];

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
            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
            Tầm nhìn vi mô · Ống kính hiển vi AI
          </span>
          <h2 className="mt-3 text-balance text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[44px]">
            Đây là cái AI đang thấy. Còn mắt thường thì chưa.
          </h2>
          <p className="mx-auto mt-2 max-w-[60ch] text-pretty text-[14px] leading-relaxed text-foreground/65 sm:text-[15.5px]">
            Chạm vào từng mẫu mô da để quan sát cấu trúc biểu bì dưới ống kính
            quang học AI và đọc tín hiệu chẩn đoán tế bào.
          </p>
        </motion.div>

        {/* Interactive 4 Macro Cards */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {MACROS.map((m) => (
            <MacroCard
              key={m.id}
              macro={m}
              isSelected={m.id === selectedId}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}
        </motion.div>

        {/* Live Macro Inspector Insight Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMacro.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-4 rounded-2xl p-3.5 sm:p-4 shadow-sm border"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(254,243,199,0.5) 100%)",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 8px 24px rgba(245,158,11,0.08)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 mt-0.5">
                <Zap className="size-3.5" />
              </span>
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-wider text-amber-800">
                  Phân tích quang học vi mô — {selectedMacro.label} ({selectedMacro.metric}):
                </p>
                <p className="mt-0.5 text-[12px] sm:text-[13px] leading-relaxed text-foreground/80">
                  {selectedMacro.insight}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function MacroCard({
  macro,
  isSelected,
  onSelect,
}: {
  macro: Macro;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.article
      variants={fadeUp}
      onClick={onSelect}
      className="relative cursor-pointer overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all active:scale-98 select-none"
      style={{
        ...GLASS,
        ...GPU,
        border: isSelected
          ? "1.5px solid rgba(245,158,11,0.8)"
          : "1px solid rgba(255,255,255,0.75)",
        boxShadow: isSelected
          ? "0 8px 24px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.95)"
          : "0 4px 16px rgba(31,38,135,0.05)",
      }}
    >
      {/* Macro texture preview */}
      <div
        className="relative aspect-square overflow-hidden rounded-xl"
        style={{
          background: macro.background,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.45), inset 0 12px 28px rgba(0,0,0,0.06)",
        }}
      >
        {/* If a real macro photo is provided, layer it on top */}
        {macro.imageSrc && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={macro.imageSrc}
            alt={`${macro.label} — ${macro.metric}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* AI hotspot markers */}
        {macro.hotspots?.map((hs, idx) => (
          <motion.span
            key={idx}
            aria-hidden
            className="absolute rounded-full"
            style={{
              left: hs.x,
              top: hs.y,
              width: hs.size,
              height: hs.size,
              transform: "translate(-50%, -50%)",
              background: hs.color,
              boxShadow: `0 0 0 ${hs.size * 0.5}px ${hs.color}33, 0 0 ${hs.size * 1.5}px ${hs.color}88`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{
              duration: 0.4,
              delay: 0.2 + idx * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}

        {/* Crosshair viewfinder */}
        <CrosshairFrame />

        {/* AI metric badge */}
        <div
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-wider text-white select-none"
          style={{
            background: isSelected
              ? "rgba(217,119,6,0.9)"
              : "rgba(15,23,42,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="size-1 rounded-full bg-emerald-400" />
          {macro.metric}
        </div>
      </div>

      {/* Caption */}
      <div className="px-1 pb-0.5 pt-2.5 sm:pt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13.5px] sm:text-[14px] font-bold tracking-tight text-foreground">
            {macro.label}
          </h3>
          {isSelected && (
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/60 line-clamp-2">
          {macro.body}
        </p>
      </div>
    </motion.article>
  );
}

function CrosshairFrame() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {[
        [4, 4, 4, 12],
        [4, 4, 12, 4],
        [96, 4, 96, 12],
        [96, 4, 88, 4],
        [4, 96, 4, 88],
        [4, 96, 12, 96],
        [96, 96, 96, 88],
        [96, 96, 88, 96],
      ].map(([x1, y1, x2, y2], idx) => (
        <line
          key={idx}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line
        x1="48"
        y1="50"
        x2="52"
        y2="50"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="50"
        y1="48"
        x2="50"
        y2="52"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
