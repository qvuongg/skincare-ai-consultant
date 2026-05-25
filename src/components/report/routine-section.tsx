"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Beaker,
  Droplets,
  Moon,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";

import type { CompositeBreakdown } from "@/lib/scoring/engine";

import { GlassCard } from "./glass-card";
import type { ReportContext } from "./insights";
import { REPORT_SPRING } from "./types";

// ════════════════════════════════════════════════════════════════════════
// Data model — mirrors the JSON contract the routine engine will emit.
// `step_id` / `ai_reason` / `affiliate_url` are the three fields callers
// outside this file are expected to map against.
// ════════════════════════════════════════════════════════════════════════

type RoutineStepId = "cleanse" | "treat" | "protect";
type RoutineTab = "morning" | "evening";

type IngredientBadge = {
  /** Display label, e.g. "BHA 2%", "Niacinamide 10%". */
  label: string;
  /** Visual family — drives the badge tint. */
  tone: "acid" | "vitamin" | "barrier" | "spf";
};

type RoutineProduct = {
  step_id: RoutineStepId;
  brand: string;
  name: string;
  /** Color seed for the squircle product cover when no real photo is available. */
  hero_color: string;
  ingredients: IngredientBadge[];
  /** Price in Vietnamese đồng — formatted at render. */
  price_vnd: number;
  ai_reason: {
    /** Highlighted ingredient name. */
    ingredient: string;
    /** Skin-issue area this product targets, in Vietnamese. */
    target_issue: string;
  };
  affiliate_url: string;
};

// ── Step config — shared between morning & evening tabs ─────────────────

type StepSpec = {
  id: RoutineStepId;
  index: string;
  title: string;
  hint: string;
  icon: LucideIcon;
};

const STEPS: readonly StepSpec[] = [
  {
    id: "cleanse",
    index: "01",
    title: "Làm sạch",
    hint: "Cleanse",
    icon: Droplets,
  },
  {
    id: "treat",
    index: "02",
    title: "Điều trị chuyên sâu",
    hint: "Treat",
    icon: Beaker,
  },
  {
    id: "protect",
    index: "03",
    title: "Phục hồi & Bảo vệ",
    hint: "Protect",
    icon: ShieldCheck,
  },
];

// ── Ingredient badge tints (Liquid Glass swatches) ──────────────────────

const INGREDIENT_TINT: Record<IngredientBadge["tone"], string> = {
  acid: "color-mix(in srgb, #F59E0B 22%, rgba(255,255,255,0.65))",
  vitamin: "color-mix(in srgb, #EC4899 22%, rgba(255,255,255,0.65))",
  barrier: "color-mix(in srgb, #22C55E 22%, rgba(255,255,255,0.65))",
  spf: "color-mix(in srgb, #FACC15 30%, rgba(255,255,255,0.65))",
};

const INGREDIENT_TEXT: Record<IngredientBadge["tone"], string> = {
  acid: "#92400E",
  vitamin: "#9D174D",
  barrier: "#14532D",
  spf: "#713F12",
};

// ── Iris Glow accent — the premium purple-blue used by the "Mua ngay" CTA
//    and the AI rationale spark. Kept as a CSS variable so designers can
//    rebrand without touching component code.

const IRIS = "#7C5CFC";

// ════════════════════════════════════════════════════════════════════════
// Mock product catalogue. Replace with API/Supabase fetch once the routine
// engine is live. Shape is intentionally identical to the future payload.
// ════════════════════════════════════════════════════════════════════════

const MORNING_PRODUCTS: readonly RoutineProduct[] = [
  {
    step_id: "cleanse",
    brand: "Cetaphil",
    name: "Gentle Skin Cleanser",
    hero_color: "#BFDBFE",
    ingredients: [{ label: "pH 5.5", tone: "barrier" }],
    price_vnd: 215_000,
    ai_reason: {
      ingredient: "công thức non-foaming dịu nhẹ",
      target_issue: "hàng rào da đang nhạy cảm vào buổi sáng",
    },
    affiliate_url: "https://shopee.vn/cetaphil-gentle-cleanser",
  },
  {
    step_id: "treat",
    brand: "The Ordinary",
    name: "Niacinamide 10% + Zinc 1%",
    hero_color: "#FBCFE8",
    ingredients: [
      { label: "Niacinamide 10%", tone: "vitamin" },
      { label: "Zinc 1%", tone: "barrier" },
    ],
    price_vnd: 285_000,
    ai_reason: {
      ingredient: "Niacinamide 10%",
      target_issue: "lỗ chân lông to và vết thâm sau mụn",
    },
    affiliate_url: "https://shopee.vn/the-ordinary-niacinamide",
  },
  {
    step_id: "protect",
    brand: "Anessa",
    name: "Perfect UV Sunscreen Skincare Milk SPF50+",
    hero_color: "#FDE68A",
    ingredients: [
      { label: "SPF50+ PA++++", tone: "spf" },
      { label: "Hyaluronic Acid", tone: "barrier" },
    ],
    price_vnd: 545_000,
    ai_reason: {
      ingredient: "lá chắn UV SPF50+ PA++++",
      target_issue: "sạm nám và lão hóa do tia UV ở khí hậu nhiệt đới",
    },
    affiliate_url: "https://shopee.vn/anessa-perfect-uv",
  },
];

const EVENING_PRODUCTS: readonly RoutineProduct[] = [
  {
    step_id: "cleanse",
    brand: "Bioderma",
    name: "Sensibio H2O Micellar Water",
    hero_color: "#C7D2FE",
    ingredients: [{ label: "Micellar", tone: "barrier" }],
    price_vnd: 460_000,
    ai_reason: {
      ingredient: "phân tử micelle",
      target_issue: "lớp cặn make-up & kem chống nắng tích tụ trong ngày",
    },
    affiliate_url: "https://shopee.vn/bioderma-sensibio",
  },
  {
    step_id: "treat",
    brand: "Paula's Choice",
    name: "Skin Perfecting 2% BHA Liquid Exfoliant",
    hero_color: "#FECACA",
    ingredients: [
      { label: "BHA 2%", tone: "acid" },
      { label: "Green Tea", tone: "barrier" },
    ],
    price_vnd: 720_000,
    ai_reason: {
      ingredient: "BHA (Salicylic Acid) 2%",
      target_issue: "mụn ẩn dưới da và bít tắc lỗ chân lông",
    },
    affiliate_url: "https://shopee.vn/paulas-choice-bha",
  },
  {
    step_id: "protect",
    brand: "La Roche-Posay",
    name: "Toleriane Double Repair Moisturizer",
    hero_color: "#A7F3D0",
    ingredients: [
      { label: "Ceramide-3", tone: "barrier" },
      { label: "Niacinamide", tone: "vitamin" },
    ],
    price_vnd: 425_000,
    ai_reason: {
      ingredient: "bộ ba Ceramide & Niacinamide",
      target_issue: "phục hồi hàng rào da trong giờ vàng 22h–2h sáng",
    },
    affiliate_url: "https://shopee.vn/lrp-toleriane",
  },
];

// ════════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════════

type Props = {
  ctx: ReportContext;
  /** Direction-corrected metric scores — kept available for future
   *  product-selection personalization. Currently surfaced via the
   *  intro copy only. */
  breakdown: CompositeBreakdown;
};

export function RoutineSection({ ctx, breakdown }: Props) {
  const [tab, setTab] = useState<RoutineTab>("morning");

  const products = tab === "morning" ? MORNING_PRODUCTS : EVENING_PRODUCTS;
  const primaryConcern = pickPrimaryConcern(breakdown);

  return (
    <section
      style={{ ["--iris" as string]: IRIS } as CSSProperties}
      className="flex flex-col gap-4"
    >
      <Header
        userName={ctx.userName}
        primaryConcern={primaryConcern}
        goalLabel={ctx.goalLabel}
      />

      <TabBar tab={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={REPORT_SPRING}
          className="flex flex-col gap-5"
        >
          {STEPS.map((step, stepIdx) => {
            const stepProducts = products.filter((p) => p.step_id === step.id);
            if (stepProducts.length === 0) return null;
            return (
              <StepBlock
                key={step.id}
                step={step}
                products={stepProducts}
                stepIndex={stepIdx}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────

function Header({
  userName,
  primaryConcern,
  goalLabel,
}: {
  userName: string;
  primaryConcern: string | null;
  goalLabel: string | null;
}) {
  const name = userName || "bạn";
  const subtitle = primaryConcern
    ? `Lộ trình 3 bước Mika thiết kế riêng cho ${name} — ưu tiên xử lý ${primaryConcern}.`
    : goalLabel
      ? `Lộ trình 3 bước Mika thiết kế cho mục tiêu ${goalLabel} của ${name}.`
      : `Lộ trình 3 bước được Mika cá nhân hóa theo profile của ${name}.`;

  return (
    <header className="px-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65">
        <Sparkles className="size-3" strokeWidth={2.2} />
        Routine cá nhân hóa
      </span>
      <h2 className="mt-2 text-[20px] font-semibold leading-tight tracking-tight text-foreground">
        Mika đã chọn sẵn 3 bước cho bạn
      </h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/65">
        {subtitle}
      </p>
    </header>
  );
}

function TabBar({
  tab,
  onChange,
}: {
  tab: RoutineTab;
  onChange: (next: RoutineTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Chọn routine sáng hoặc tối"
      className="relative mx-auto flex w-full max-w-[280px] items-center gap-1 rounded-full p-1"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow:
          "0 14px 40px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.55)",
      }}
    >
      <TabButton
        active={tab === "morning"}
        onClick={() => onChange("morning")}
        label="Sáng"
        Icon={Sun}
        activeColor="#F59E0B"
        activeBg="color-mix(in srgb, #F59E0B 18%, rgba(255,255,255,0.75))"
      />
      <TabButton
        active={tab === "evening"}
        onClick={() => onChange("evening")}
        label="Tối"
        Icon={Moon}
        activeColor="#64748B"
        activeBg="color-mix(in srgb, #64748B 16%, rgba(255,255,255,0.78))"
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  Icon,
  activeColor,
  activeBg,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
  activeBg: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="relative flex-1 rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors"
      style={{
        color: active ? activeColor : "rgba(15,23,42,0.55)",
      }}
    >
      {active && (
        <motion.span
          layoutId="routine-tab-indicator"
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: activeBg,
            border: "1px solid rgba(255,255,255,0.65)",
            boxShadow: `0 6px 18px color-mix(in srgb, ${activeColor} 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.55)`,
          }}
          transition={REPORT_SPRING}
        />
      )}
      <span className="relative flex items-center justify-center gap-1.5">
        <Icon className="size-4" strokeWidth={2.2} />
        {label}
      </span>
    </button>
  );
}

function StepBlock({
  step,
  products,
  stepIndex,
}: {
  step: StepSpec;
  products: readonly RoutineProduct[];
  stepIndex: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay: 0.08 + stepIndex * 0.06 }}
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-2.5 px-1">
        <span
          className="flex size-9 items-center justify-center rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--iris) 14%, white)",
            color: IRIS,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
        >
          <step.icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Step {step.index} · {step.hint}
          </p>
          <p className="text-[14px] font-semibold tracking-tight text-foreground">
            {step.title}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {products.map((product, i) => (
          <ProductCard
            key={`${step.id}-${i}`}
            product={product}
            delay={0.14 + stepIndex * 0.06 + i * 0.05}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ProductCard({
  product,
  delay,
}: {
  product: RoutineProduct;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay }}
    >
      <GlassCard className="p-3.5">
        {/* ── Top tier — E-commerce row ──────────────────────────────── */}
        <div className="flex items-stretch gap-3">
          <ProductCover color={product.hero_color} brand={product.brand} />

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                {product.brand}
              </p>
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground">
                {product.name}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {product.ingredients.map((ing) => (
                  <span
                    key={ing.label}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight"
                    style={{
                      background: INGREDIENT_TINT[ing.tone],
                      color: INGREDIENT_TEXT[ing.tone],
                      border: "1px solid rgba(255,255,255,0.55)",
                    }}
                  >
                    {ing.label}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-foreground">
              {formatVnd(product.price_vnd)}
            </p>
          </div>

          <BuyButton href={product.affiliate_url} />
        </div>

        {/* ── Bottom tier — AI Rationale Box ─────────────────────────── */}
        <RationaleBox reason={product.ai_reason} />
      </GlassCard>
    </motion.div>
  );
}

function ProductCover({ color, brand }: { color: string; brand: string }) {
  return (
    <div
      aria-hidden
      className="relative flex size-[78px] shrink-0 items-center justify-center rounded-[22px] text-[18px] font-semibold tracking-tight"
      style={{
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, white))`,
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "0 10px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        color: "rgba(15,23,42,0.55)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />
      {brand.charAt(0)}
    </div>
  );
}

function BuyButton({ href }: { href: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex shrink-0 items-center gap-1 self-center rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-tight text-white"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--iris) 92%, white), color-mix(in srgb, var(--iris) 70%, transparent))",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow:
          "0 10px 28px color-mix(in srgb, var(--iris) 50%, transparent), inset 0 1px 0 rgba(255,255,255,0.55)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />
      <ShoppingBag className="size-3.5" strokeWidth={2.4} />
      Mua ngay
    </motion.a>
  );
}

function RationaleBox({
  reason,
}: {
  reason: RoutineProduct["ai_reason"];
}) {
  return (
    <div className="mt-3 pl-4">
      {/* Dashed divider — visually splits e-commerce from "the why". */}
      <div
        aria-hidden
        className="-ml-4 mb-2.5 border-t border-dashed"
        style={{ borderColor: "rgba(15,23,42,0.12)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="rounded-2xl px-3 py-2"
        style={{
          background: "color-mix(in srgb, var(--iris) 8%, rgba(255,255,255,0.55))",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid color-mix(in srgb, var(--iris) 22%, rgba(255,255,255,0.45))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <p className="text-[12px] leading-relaxed text-foreground/80">
          <span aria-hidden className="mr-1">
            ✨
          </span>
          <span className="font-semibold" style={{ color: IRIS }}>
            Mika khuyên dùng vì:
          </span>{" "}
          Chứa{" "}
          <span className="font-semibold text-foreground">
            {reason.ingredient}
          </span>{" "}
          giúp giải quyết trực tiếp vùng{" "}
          <span className="font-semibold text-foreground">
            {reason.target_issue}
          </span>
          .
        </p>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const CONCERN_LABEL: Partial<Record<keyof CompositeBreakdown, string>> = {
  hydration: "thiếu ẩm",
  acne: "tình trạng mụn",
  pigmentation: "thâm sạm",
  sebum: "mất cân bằng dầu",
  pore: "lỗ chân lông to",
  wrinkle: "nếp nhăn sớm",
  skin_tone_evenness: "da không đều màu",
  redness: "da đỏ nhạy cảm",
  texture: "bề mặt da thô ráp",
};

/**
 * Surface the user's lowest-score metric as a short Vietnamese label —
 * powers the subtitle line ("ưu tiên xử lý X"). Returns `null` if every
 * metric is already healthy (>= 75), so the copy doesn't fabricate a
 * concern that isn't there.
 */
function pickPrimaryConcern(breakdown: CompositeBreakdown): string | null {
  const entries = Object.entries(breakdown) as Array<
    [keyof CompositeBreakdown, number]
  >;
  if (entries.length === 0) return null;
  entries.sort((a, b) => a[1] - b[1]);
  const [worstKey, worstScore] = entries[0];
  if (worstScore >= 75) return null;
  return CONCERN_LABEL[worstKey] ?? null;
}

function formatVnd(value: number): string {
  // `vi-VN` uses "." as the thousands separator — matches local
  // shopping-app convention better than `Intl.NumberFormat`'s currency mode.
  return `${value.toLocaleString("vi-VN")}đ`;
}
