"use client";

import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  CloudSun,
  ScanFace,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { useLowPower } from "@/lib/hooks/use-low-power";

type Byte = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  iconBg: string;
  glow: string;
};

const BYTES: Byte[] = [
  {
    id: "ai-scan",
    icon: ScanFace,
    title: "AI Scan 3D",
    body: "Quét 468 điểm mốc, phát hiện vấn đề tiềm ẩn bên dưới bề mặt da.",
    iconBg:
      "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(168,85,247,0.45)",
  },
  {
    id: "routine",
    icon: Sparkles,
    title: "Routine tinh gọn",
    body: "Loại bỏ 80% các bước thừa thãi. Chỉ giữ những gì da bạn thực sự cần.",
    iconBg:
      "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))",
    glow: "rgba(34,197,94,0.4)",
  },
  {
    id: "weather",
    icon: CloudSun,
    title: "Weather-Adaptive",
    body: "Tự động điều chỉnh routine theo UV và độ ẩm tại Đà Nẵng hôm nay.",
    iconBg:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(244,114,182,0.95))",
    glow: "rgba(245,158,11,0.4)",
  },
];

// Stagger container — children animate in sequence as the section enters view.
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

// Each card pops in with a soft elastic spring.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 22, mass: 0.9 },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 28 },
  },
};

export function HomeClient() {
  const router = useRouter();
  const { reduced, isMobile } = useLowPower();
  const { scrollY } = useScroll();

  // Parallax — three independent transforms so each card lags scroll by a
  // different amount, producing a depth illusion across z-layers. Disabled
  // on mobile (the depth illusion barely reads at phone viewport sizes,
  // but the per-frame scroll work is just as costly there) and when the
  // user prefers reduced motion.
  const noParallax = reduced || isMobile;
  const y1 = useTransform(scrollY, [0, 400], [0, noParallax ? 0 : -10]);
  const y2 = useTransform(scrollY, [0, 400], [0, noParallax ? 0 : -26]);
  const y3 = useTransform(scrollY, [0, 400], [0, noParallax ? 0 : -42]);
  const yOffsets = [y1, y2, y3];

  const startScan = () => router.push("/onboarding");

  return (
    <div className="relative flex min-h-dvh flex-col">
      <MeshGradient />

      {/* App-shell: 480px column on desktop, full-bleed on mobile */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* ─── Hero ──────────────────────────────────────────────── */}
        <section className="px-5 pt-10 pb-6 sm:px-6 sm:pt-14">
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-4 text-center"
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
              }}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Đang mở miễn phí · Đà Nẵng
            </span>

            <h1 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-tight text-foreground">
              Làn da đẹp không chỉ là may mắn.{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Đó là khoa học.
              </span>
            </h1>

            <p className="text-pretty text-[15px] leading-relaxed text-foreground/65">
              Phân tích AI chính xác đến từng lỗ chân lông. Cá nhân hóa
              routine chỉ trong 60 giây.
            </p>
          </motion.div>

          {/* CTA — glass pill with iris glow on hover/tap */}
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.18 }}
            className="mt-7 flex justify-center"
          >
            <motion.button
              type="button"
              onClick={startScan}
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: 1.03,
                      boxShadow:
                        "0 0 0 14px rgba(168,85,247,0.18), 0 18px 44px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.95)",
                    }
              }
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="relative inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-foreground"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.75)",
                boxShadow:
                  "0 14px 36px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              {/* Specular highlight on top edge */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
                }}
              />
              <Zap className="size-4 text-purple-600" strokeWidth={2.6} />
              Bắt đầu soi da ngay
            </motion.button>
          </motion.div>
        </section>

        {/* ─── Discovery Grid (Skincare Bytes) ───────────────────── */}
        <section className="px-5 pb-32 pt-6 sm:px-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
              Skincare Bytes
            </h2>
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/45">
              Đọc nhanh trong 30s
            </span>
          </div>

          <motion.ul
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-4"
          >
            {BYTES.map((byte, idx) => (
              <motion.li
                key={byte.id}
                variants={cardVariants}
                whileTap={{ scale: 0.97 }}
                whileHover={
                  reduced
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.012,
                        transition: {
                          type: "spring",
                          stiffness: 360,
                          damping: 18,
                        },
                      }
                }
                style={{
                  y: yOffsets[idx],
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
                onClick={startScan}
                className="cursor-pointer"
              >
                <ByteCard byte={byte} />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </div>

      {/* ─── Sticky Bottom Nav — always-available "Quét da ngay" ─ */}
      {/* `inset-x-0 max-w-[480px] mx-auto` constrains the fixed nav to the */}
      {/* same phone-shaped column as the rest of the shell on desktop, */}
      {/* full-width on mobile. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] px-4"
        style={{
          paddingBottom: "max(0.85rem, env(safe-area-inset-bottom))",
        }}
      >
        <motion.button
          type="button"
          onClick={startScan}
          whileTap={{ scale: 0.97 }}
          whileHover={reduced ? undefined : { scale: 1.02 }}
          transition={{ type: "spring", stiffness: 360, damping: 22 }}
          className="pointer-events-auto relative flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow:
              "0 18px 44px rgba(168,85,247,0.32), inset 0 1px 0 rgba(255,255,255,0.55)",
            willChange: "transform",
            transform: "translateZ(0)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
            }}
          />
          <ScanFace className="size-4" strokeWidth={2.6} />
          Quét da ngay
        </motion.button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Skincare Byte card — squircle icon + title + body. Glass surface tuned
// for the light mesh-gradient background (translucent white, not white-on-
// dark like the photo-scan toasts).
// ════════════════════════════════════════════════════════════════════════
function ByteCard({ byte }: { byte: Byte }) {
  const Icon = byte.icon;
  return (
    <article
      className="relative flex items-start gap-4 rounded-3xl p-5"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow:
          "0 14px 36px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      {/* Specular highlight on top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      {/* Squircle icon — Apple-style ~30% radius on 48px = 14px */}
      <span
        className="flex size-12 shrink-0 items-center justify-center text-white"
        style={{
          background: byte.iconBg,
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: `0 10px 24px ${byte.glow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
        }}
      >
        <Icon className="size-5" strokeWidth={2.4} />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {byte.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-foreground/65">
          {byte.body}
        </p>
      </div>
    </article>
  );
}
