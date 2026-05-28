"use client";

import { motion } from "framer-motion";

import { GLASS, GLASS_LIGHT, GPU, fadeUp, stagger } from "./landing-tokens";

// "What AI sees" section — gives the page a tactile, photographic-feeling
// moment without requiring real macro photos. Each card is a CSS-only
// composite of layered radial gradients that imitate skin under macro
// lens (dry crack lines, oil sheen, inflamed bumps, pigmentation patches).
//
// `imageSrc` is a slot — when a real macro photo arrives later, drop it
// into the corresponding card and it overlays/replaces the CSS texture.

type Macro = {
  id: string;
  label: string;
  metric: string;
  body: string;
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
            <span className="size-1.5 rounded-full bg-rose-500" />
            Tầm nhìn vi mô
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px] lg:text-[48px]">
            Đây là cái AI đang thấy. Còn mắt thường thì chưa.
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
            Camera điện thoại của bạn đủ phân giải để Mika đọc được hoa văn da
            ở mức cận cảnh. Sau đó là chuyện của AI — phân loại, định lượng,
            báo cáo.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {MACROS.map((m) => (
            <MacroCard key={m.id} macro={m} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function MacroCard({ macro }: { macro: Macro }) {
  return (
    <motion.article
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl p-3"
      style={{ ...GLASS, ...GPU }}
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
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-mono font-semibold uppercase tracking-wider text-white"
          style={{
            background: "rgba(15,23,42,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <span className="size-1 rounded-full bg-emerald-400" />
          {macro.metric}
        </div>
      </div>

      {/* Caption */}
      <div className="px-1 pb-1 pt-3.5">
        <h3 className="text-[14.5px] font-semibold tracking-tight text-foreground">
          {macro.label}
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/60">
          {macro.body}
        </p>
      </div>
    </motion.article>
  );
}

// Corner brackets + center cross — "viewfinder" feel without overlaying the
// content too heavily. Drawn in SVG so it scales crisp at any size.
function CrosshairFrame() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Corner ticks */}
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
      {/* Center crosshair */}
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
