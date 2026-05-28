"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  CloudSun,
  Layers,
  ScanFace,
  Sparkles,
} from "lucide-react";

import { IrisCta } from "./iris-cta";
import { GLASS_LIGHT, GPU, SPRING, fadeUp, stagger } from "./landing-tokens";
import { ValueCard, type ValueProp } from "./value-card";

const VALUE_PROPS: ValueProp[] = [
  {
    id: "vision",
    icon: ScanFace,
    eyebrow: "AI Vision 3D",
    title: "Quét đa chiều diện rộng",
    body: "Phát hiện mụn ẩn và vùng hụt ẩm sâu bên dưới bề mặt — những thứ mắt thường hay gương sáng nhất cũng bỏ lỡ.",
    iconBg:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(168,85,247,0.45)",
  },
  {
    id: "routine",
    icon: Layers,
    eyebrow: "Routine Tinh Gọn",
    title: "Nói không với 10 bước rườm rà",
    body: "Chỉ giữ lại những bước da bạn thực sự thèm khát. Tinh giản, trung thực, vừa đủ để đẹp.",
    iconBg:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(45,212,191,0.95))",
    glow: "rgba(34,197,94,0.40)",
  },
  {
    id: "context",
    icon: CloudSun,
    eyebrow: "Bối Cảnh Cá Nhân Hóa",
    title: "Đồng bộ với đời thực của bạn",
    body: "Tự động hiệu chỉnh điểm số theo độ tuổi, môi trường máy lạnh và chỉ số UV thực tế tại Đà Nẵng hôm nay.",
    iconBg:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
    glow: "rgba(245,158,11,0.40)",
  },
];

// Three floating glass cards on desktop, with different (left, top, z-index)
// anchors so they layer into a stack. Per-card scrollY parallax in HeroSection
// then makes them drift past at different rates.
const FLOATING_POSITIONS: { className: string }[] = [
  { className: "absolute left-0 right-14 top-0 z-10" },
  { className: "absolute left-12 right-0 top-44 z-30" },
  { className: "absolute left-4 right-20 top-[22rem] z-20" },
];

export function Hero({
  onCta,
  reduced,
  noParallax,
}: {
  onCta: () => void;
  reduced: boolean;
  noParallax: boolean;
}) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, noParallax ? 0 : -30]);
  const y2 = useTransform(scrollY, [0, 600], [0, noParallax ? 0 : -70]);
  const y3 = useTransform(scrollY, [0, 600], [0, noParallax ? 0 : -50]);
  const yOffsets: MotionValue<number>[] = [y1, y2, y3];

  return (
    <section className="relative px-6 pt-12 pb-16 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-7"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70"
              style={{
                ...GLASS_LIGHT,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.85), 0 6px 20px rgba(168,85,247,0.10)",
              }}
            >
              <Sparkles
                className="size-3.5 text-purple-600"
                strokeWidth={2.6}
              />
              Kỷ nguyên soi da công nghệ mới
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-balance text-[40px] font-semibold leading-[1.02] tracking-tight sm:text-[52px] lg:text-[68px]"
              style={{
                filter: "drop-shadow(0 14px 40px rgba(31,38,135,0.10))",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(180deg, #1f2937 0%, #4b5563 50%, #111827 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Làn da đẹp không chỉ là may mắn.{" "}
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Đó là khoa học.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-[44ch] text-pretty text-[16px] leading-relaxed text-foreground/65 sm:text-[17px]"
            >
              Hệ thống phân tích AI quét{" "}
              <strong className="font-semibold text-foreground/85">
                468 điểm mốc
              </strong>
              , đo lường chính xác{" "}
              <strong className="font-semibold text-foreground/85">
                11 chỉ số da
              </strong>{" "}
              và thiết kế Routine cá nhân hóa chỉ trong 60 giây.
            </motion.p>

            <motion.div variants={fadeUp}>
              <IrisCta
                label="Bắt đầu hành trình soi da"
                onClick={onCta}
                reduced={reduced}
              />
            </motion.div>
          </motion.div>

          <div className="relative">
            {/* Desktop: absolutely-positioned floating cards with parallax */}
            <div className="relative hidden h-[600px] lg:block">
              {VALUE_PROPS.map((vp, idx) => (
                <FloatingValueCard
                  key={vp.id}
                  prop={vp}
                  index={idx}
                  y={yOffsets[idx]}
                  reduced={reduced}
                />
              ))}
            </div>
            {/* Mobile: stacked column, no overlap, no parallax */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {VALUE_PROPS.map((vp, idx) => (
                <motion.div
                  key={vp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...SPRING, delay: 0.05 + idx * 0.08 }}
                  style={GPU}
                >
                  <ValueCard prop={vp} reduced={reduced} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingValueCard({
  prop,
  index,
  y,
  reduced,
}: {
  prop: ValueProp;
  index: number;
  y: MotionValue<number>;
  reduced: boolean;
}) {
  return (
    <motion.div
      className={FLOATING_POSITIONS[index].className}
      style={{ y, ...GPU }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...SPRING, delay: 0.18 + index * 0.12 }}
        style={GPU}
      >
        <ValueCard prop={prop} reduced={reduced} />
      </motion.div>
    </motion.div>
  );
}
