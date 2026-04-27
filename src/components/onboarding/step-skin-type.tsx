"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Droplet,
  Flame,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SkinTypeDef = {
  id: string;
  emoji: string;
  title: string;
  vibe: string;
  icon: LucideIcon;
  tint: string;
  glow: string;
};

const SKIN_TYPES: SkinTypeDef[] = [
  {
    id: "oily",
    emoji: "💦",
    title: "Da dầu",
    vibe: "Bóng dầu sau 2 tiếng",
    icon: Droplet,
    tint: "rgba(59,130,246,0.10)",
    glow: "rgba(59,130,246,0.40)",
  },
  {
    id: "dry",
    emoji: "🌵",
    title: "Da khô",
    vibe: "Căng rát, bong tróc",
    icon: Flame,
    tint: "rgba(244,114,182,0.10)",
    glow: "rgba(244,114,182,0.40)",
  },
  {
    id: "combo",
    emoji: "🌗",
    title: "Hỗn hợp",
    vibe: "Chữ T dầu, má khô",
    icon: Layers,
    tint: "rgba(168,85,247,0.10)",
    glow: "rgba(168,85,247,0.40)",
  },
  {
    id: "normal",
    emoji: "✨",
    title: "Da thường",
    vibe: "Êm ru, ít drama",
    icon: Sparkles,
    tint: "rgba(34,197,94,0.10)",
    glow: "rgba(34,197,94,0.40)",
  },
];

type Props = {
  value: string | null;
  onChange: (id: string) => void;
  onNext: () => void;
};

export function StepSkinType({ value, onChange, onNext }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 03 · Skin Type
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Thú thật đi, da bạn thuộc team nào?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Không chắc cũng không sao — Mika sẽ verify lại ở bước scan ảnh.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Loại da"
        className="mt-6 grid grid-cols-2 gap-3"
      >
        {SKIN_TYPES.map((s, idx) => {
          const selected = value === s.id;
          const Icon = s.icon;
          return (
            <motion.button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.04 + idx * 0.05,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              className={cn(
                "relative aspect-square min-h-[148px] overflow-hidden p-4 text-left focus:outline-none"
              )}
              style={{
                borderRadius: "1.75rem",
                background: `linear-gradient(135deg, ${s.tint}, rgba(255,255,255,0.5))`,
                backdropFilter: "blur(30px) saturate(180%)",
                WebkitBackdropFilter: "blur(30px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: selected
                  ? `0 22px 48px -10px ${s.glow}, 0 0 0 2px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`
                  : "0 12px 30px rgba(31,38,135,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
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

              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span
                    className="flex size-10 items-center justify-center rounded-2xl bg-white/60 text-foreground/70"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-2xl leading-none" aria-hidden>
                    {s.emoji}
                  </span>
                </div>
                <div>
                  <p className="text-[17px] font-semibold tracking-tight text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-foreground/55">
                    {s.vibe}
                  </p>
                </div>
              </div>

              {selected && (
                <motion.span
                  layoutId="skin-type-glow"
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: "1.75rem",
                    background: `radial-gradient(circle at 80% 0%, ${s.glow}, transparent 55%)`,
                    opacity: 0.55,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          disabled={!value}
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
