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
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import type { AiMetrics, CompositeBreakdown } from "@/lib/scoring/engine";
import type { HeroProduct } from "@/lib/products/matcher";
import type { ProductCategoryId } from "@/types/skin-analysis";
import { formatVND } from "@/types/skin-analysis";

import { GlassCard } from "./glass-card";
import { explainPick } from "./explain-pick";
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
// DB → RoutineProduct mapping
// ────────────────────────────────────────────────────────────────────────
// Picks one HeroProduct per step from `recommendedProducts` and rewrites it
// into the local RoutineProduct shape. ai_reason copy is category-level
// placeholder text until the routine engine (§9) generates personalized
// rationales per-user.
// ════════════════════════════════════════════════════════════════════════

const HERO_COLOR_BY_CATEGORY: Record<ProductCategoryId, string> = {
  cleanser: "#BFDBFE",
  treatment: "#FBCFE8",
  moisturizer: "#A7F3D0",
  sunscreen: "#FDE68A",
};

function inferTone(
  ingredient: string,
  category: ProductCategoryId
): IngredientBadge["tone"] {
  const lower = ingredient.toLowerCase();
  if (
    category === "sunscreen" ||
    lower.includes("spf") ||
    lower.includes("pa+")
  )
    return "spf";
  if (
    lower.includes("bha") ||
    lower.includes("aha") ||
    lower.includes("salicylic") ||
    lower.includes("glycolic") ||
    lower.includes("lactic")
  )
    return "acid";
  if (
    lower.includes("niacinamide") ||
    lower.includes("vitamin") ||
    lower.includes("retinol") ||
    lower.includes("peptide")
  )
    return "vitamin";
  return "barrier";
}

function toRoutineProduct(
  hero: HeroProduct,
  step_id: RoutineStepId,
  metrics: AiMetrics
): RoutineProduct {
  const rationale = explainPick(hero, metrics, hero.category);
  return {
    step_id,
    brand: hero.brand,
    name: hero.name,
    hero_color: HERO_COLOR_BY_CATEGORY[hero.category],
    ingredients: hero.key_ingredients.slice(0, 2).map((label) => ({
      label,
      tone: inferTone(label, hero.category),
    })),
    price_vnd: hero.price_vnd,
    ai_reason: rationale,
    affiliate_url: hero.actual_url,
  };
}

/** Per-step slot — `null` means matcher had no eligible product for that
 *  category (e.g. budget too low). The component renders an empty-state
 *  card instead of skipping the step silently. */
type RoutineSlot = { step_id: RoutineStepId; product: RoutineProduct | null };

function buildRoutines(
  matched: Record<ProductCategoryId, HeroProduct | null>,
  metrics: AiMetrics
): { morning: RoutineSlot[]; evening: RoutineSlot[] } {
  // The matcher already picked the single best product per category given
  // skin_type + budget + AiMetrics. AM and PM share cleanse & treat picks;
  // only the "protect" slot differs (sunscreen by day, moisturizer at night).
  const slot = (
    step_id: RoutineStepId,
    hero: HeroProduct | null
  ): RoutineSlot => ({
    step_id,
    product: hero ? toRoutineProduct(hero, step_id, metrics) : null,
  });

  return {
    morning: [
      slot("cleanse", matched.cleanser),
      slot("treat", matched.treatment),
      slot("protect", matched.sunscreen),
    ],
    evening: [
      slot("cleanse", matched.cleanser),
      slot("treat", matched.treatment),
      slot("protect", matched.moisturizer),
    ],
  };
}

/** Sum of unique products bought once for the month: cleanser + treatment +
 *  sunscreen + moisturizer. AM/PM share cleanse + treat picks so we don't
 *  double-count them. Returns 0 when nothing matches — caller should hide
 *  the budget bar in that case. */
function totalMonthlyCost(
  matched: Record<ProductCategoryId, HeroProduct | null>
): number {
  return (
    (matched.cleanser?.price_vnd ?? 0) +
    (matched.treatment?.price_vnd ?? 0) +
    (matched.sunscreen?.price_vnd ?? 0) +
    (matched.moisturizer?.price_vnd ?? 0)
  );
}

// ════════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════════

type Props = {
  ctx: ReportContext;
  /** Direction-corrected metric scores — kept available for future
   *  product-selection personalization. Currently surfaced via the
   *  intro copy only. */
  breakdown: CompositeBreakdown;
  /** Matcher output from the API. Routine engine §9 will replace this
   *  with personalized routine objects (incl. AI rationale). */
  recommendedProducts: Record<ProductCategoryId, HeroProduct | null>;
  /** Raw 11-metric scan output — drives the metric-aware product rationale. */
  aiMetrics: AiMetrics;
  /** User's monthly budget from onboarding. Null → hide BudgetBar. */
  budgetVnd: number | null;
};

export function RoutineSection({
  ctx,
  breakdown,
  recommendedProducts,
  aiMetrics,
  budgetVnd,
}: Props) {
  const [tab, setTab] = useState<RoutineTab>("morning");

  const routines = useMemo(
    () => buildRoutines(recommendedProducts, aiMetrics),
    [recommendedProducts, aiMetrics]
  );
  const totalCost = useMemo(
    () => totalMonthlyCost(recommendedProducts),
    [recommendedProducts]
  );
  const slots = tab === "morning" ? routines.morning : routines.evening;
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

      <BudgetBar totalVnd={totalCost} budgetVnd={budgetVnd} />

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
            const slot = slots.find((s) => s.step_id === step.id);
            return (
              <StepBlock
                key={step.id}
                step={step}
                product={slot?.product ?? null}
                stepIndex={stepIdx}
                budgetVnd={budgetVnd}
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
  product,
  stepIndex,
  budgetVnd,
}: {
  step: StepSpec;
  product: RoutineProduct | null;
  stepIndex: number;
  budgetVnd: number | null;
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

      {product ? (
        <ProductCard product={product} delay={0.14 + stepIndex * 0.06} />
      ) : (
        <EmptyStepCard
          stepTitle={step.title}
          budgetVnd={budgetVnd}
          delay={0.14 + stepIndex * 0.06}
        />
      )}
    </motion.div>
  );
}

function EmptyStepCard({
  stepTitle,
  budgetVnd,
  delay,
}: {
  stepTitle: string;
  budgetVnd: number | null;
  delay: number;
}) {
  const reason = budgetVnd
    ? `Chưa có sản phẩm ≤ ${formatVND(budgetVnd)} phù hợp với da của bạn cho bước này.`
    : "Chưa có sản phẩm phù hợp với loại da bạn khai báo cho bước này.";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REPORT_SPRING, delay }}
    >
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, #F59E0B 18%, white)",
              color: "#92400E",
            }}
          >
            ⚠
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold tracking-tight text-foreground">
              {stepTitle} — chưa tìm được sản phẩm khớp
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/65">
              {reason} Bạn có thể tăng budget ở onboarding hoặc đợi shop bổ
              sung thêm catalogue.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function BudgetBar({
  totalVnd,
  budgetVnd,
}: {
  totalVnd: number;
  budgetVnd: number | null;
}) {
  // Nothing matched → hide entirely (empty-state cards already explain).
  if (totalVnd <= 0) return null;

  const hasBudget = budgetVnd !== null && budgetVnd > 0;
  const ratio = hasBudget ? totalVnd / budgetVnd : 0;
  const diff = hasBudget ? budgetVnd - totalVnd : 0;

  // Color band: green ≤90% · amber 90-100% · red >100%
  const band: "ok" | "tight" | "over" =
    !hasBudget ? "ok" : ratio > 1 ? "over" : ratio > 0.9 ? "tight" : "ok";

  const accent: Record<typeof band, { fg: string; bar: string; bg: string }> = {
    ok: {
      fg: "#15803D",
      bar: "linear-gradient(90deg, #22C55E, #16A34A)",
      bg: "color-mix(in srgb, #22C55E 14%, white)",
    },
    tight: {
      fg: "#92400E",
      bar: "linear-gradient(90deg, #F59E0B, #D97706)",
      bg: "color-mix(in srgb, #F59E0B 16%, white)",
    },
    over: {
      fg: "#B91C1C",
      bar: "linear-gradient(90deg, #EF4444, #DC2626)",
      bg: "color-mix(in srgb, #EF4444 14%, white)",
    },
  };

  const message = !hasBudget
    ? "Bạn chưa khai báo budget ở onboarding"
    : band === "over"
      ? `Vượt budget ${formatVND(-diff)}`
      : band === "tight"
        ? `Sát budget — còn ${formatVND(diff)}`
        : `Tiết kiệm ${formatVND(diff)}`;

  const fillPct = hasBudget ? Math.min(ratio, 1) * 100 : 100;

  return (
    <div
      className="sticky top-2 z-20 -mx-1 px-1"
      // sticky requires the scroll-context ancestor to have overflow:visible;
      // the report page scrolls on body, which satisfies that.
    >
      <div
        className="rounded-2xl border border-white/55 px-3.5 py-3"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          boxShadow:
            "0 14px 32px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: accent[band].bg, color: accent[band].fg }}
            >
              <Wallet className="size-3.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                Routine tháng
              </p>
              <p className="truncate text-[13px] font-semibold tabular-nums tracking-tight text-foreground">
                {formatVND(totalVnd)}
                {hasBudget && (
                  <span className="text-foreground/45"> / {formatVND(budgetVnd)}</span>
                )}
              </p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-tight"
            style={{ background: accent[band].bg, color: accent[band].fg }}
          >
            {message}
          </span>
        </div>

        {hasBudget && (
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(15,23,42,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: accent[band].bar }}
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={REPORT_SPRING}
            />
          </div>
        )}
      </div>
    </div>
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
