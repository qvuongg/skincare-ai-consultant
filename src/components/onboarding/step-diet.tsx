"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DietOptionId =
  | "sweet"
  | "spicy"
  | "fatty"
  | "stimulants"
  | "healthy";

type DietOption = {
  id: DietOptionId;
  emoji: string;
  label: string;
  tint: string;
  glow: string;
};

const DIET_OPTIONS: DietOption[] = [
  {
    id: "sweet",
    emoji: "🍭",
    label: "Ăn ngọt nhiều",
    tint: "rgba(244, 114, 182, 0.18)",
    glow: "rgba(244, 114, 182, 0.55)",
  },
  {
    id: "spicy",
    emoji: "🌶️",
    label: "Ăn cay nhiều",
    tint: "rgba(239, 68, 68, 0.18)",
    glow: "rgba(239, 68, 68, 0.55)",
  },
  {
    id: "fatty",
    emoji: "🍔",
    label: "Ăn đồ béo nhiều",
    tint: "rgba(249, 115, 22, 0.18)",
    glow: "rgba(249, 115, 22, 0.55)",
  },
  {
    id: "stimulants",
    emoji: "☕",
    label: "Chất kích thích",
    tint: "rgba(120, 53, 15, 0.18)",
    glow: "rgba(180, 83, 9, 0.55)",
  },
  {
    id: "healthy",
    emoji: "🥗",
    label: "Đang ăn Healthy",
    tint: "rgba(34, 197, 94, 0.18)",
    glow: "rgba(34, 197, 94, 0.55)",
  },
];

type Props = {
  value: DietOptionId[];
  onChange: (next: DietOptionId[]) => void;
  onNext: () => void;
};

export function StepDiet({ value, onChange, onNext }: Props) {
  const toggle = (id: DietOptionId) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const canContinue = value.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 02 · Diet
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Menu thường ngày của bạn có gì?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Chọn tất cả những món bạn thường ăn — Mika không judge đâu, chỉ để
          tính impact lên da thôi 🤝
        </p>
      </header>

      <div
        role="group"
        aria-label="Thói quen ăn uống"
        className="mt-6 flex flex-wrap gap-2.5"
      >
        {DIET_OPTIONS.map((opt, idx) => {
          const selected = value.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(opt.id)}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.04 + idx * 0.05,
                type: "spring",
                stiffness: 380,
                damping: 22,
              }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
              className="relative isolate overflow-hidden focus:outline-none"
              style={{
                borderRadius: "9999px",
                background: selected
                  ? `linear-gradient(135deg, ${opt.tint}, rgba(255,255,255,0.65))`
                  : "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.4))",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: selected
                  ? "1px solid rgba(255,255,255,0.85)"
                  : "1px solid rgba(255,255,255,0.55)",
                boxShadow: selected
                  ? `0 14px 36px -8px ${opt.glow}, 0 0 0 2px ${opt.glow}, inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.4)`
                  : "0 8px 22px rgba(31,38,135,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-5 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
                }}
              />

              <span className="relative z-10 flex items-center gap-2 px-4 py-3">
                <span className="text-[18px] leading-none" aria-hidden>
                  {opt.emoji}
                </span>
                <span className="text-[14px] font-semibold tracking-tight text-foreground/85">
                  {opt.label}
                </span>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 16,
                    }}
                    className="ml-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] leading-snug text-foreground/45">
        🔒 Insider · Đường, dầu mỡ và caffeine ảnh hưởng trực tiếp đến nội tiết
        & độ viêm của da — Mika cần data này để cân routine cho khớp.
      </p>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          {canContinue
            ? `Đã chọn ${value.length} món, đi tiếp`
            : "Chọn ít nhất 1 món"}
          <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
