"use client";

import { motion } from "framer-motion";
import { ArrowRight, Droplets, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalCard, type GoalTone } from "@/components/onboarding/goal-card";

type GoalDef = {
  id: string;
  tone: GoalTone;
  tagline: string;
  title: string;
  description: string;
  icon: typeof Zap;
};

const GOALS: GoalDef[] = [
  {
    id: "clear_acne",
    tone: "purple",
    tagline: "Trị mụn",
    title: "Da sạch mụn",
    description: "Đẩy lùi mụn sưng & vết thâm còn sót, lấy lại bề mặt mịn.",
    icon: Zap,
  },
  {
    id: "anti_aging",
    tone: "blue",
    tagline: "Chống lão hóa",
    title: "Trẻ hơn mỗi ngày",
    description: "Mờ nếp nhăn, nâng cơ săn chắc, da căng tràn năng lượng.",
    icon: ShieldCheck,
  },
  {
    id: "hydration",
    tone: "green",
    tagline: "Cấp ẩm sâu",
    title: "Da căng mọng",
    description: "Khoá ẩm, phục hồi hàng rào, da bouncy như jelly.",
    icon: Droplets,
  },
];

// id → user-facing label for downstream contexts (Supabase lead, Gemini prompt).
export const GOAL_LABELS: Record<string, string> = Object.fromEntries(
  GOALS.map((g) => [g.id, g.tagline])
);

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
};

export function StepGoal({ value, onChange, onNext }: Props) {
  const toggle = (id: string) => {
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
          Bước 01 · Goal
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Glow-up goal của bạn là gì?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Chọn 1 hoặc nhiều mục tiêu — Mika sẽ kết hợp chúng vào một routine
          thống nhất 💆‍♀️
        </p>
      </header>

      <div
        role="group"
        aria-label="Mục tiêu skincare"
        className="mt-6 flex flex-col gap-3.5"
      >
        {GOALS.map((g, idx) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.06 + idx * 0.07,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ zIndex: GOALS.length - idx }}
          >
            <GoalCard
              tone={g.tone}
              tagline={g.tagline}
              title={g.title}
              description={g.description}
              icon={g.icon}
              selected={value.includes(g.id)}
              onSelect={() => toggle(g.id)}
            />
          </motion.div>
        ))}
      </div>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          {canContinue
            ? `Đã chọn ${value.length} mục tiêu, đi tiếp`
            : "Chọn ít nhất 1 mục tiêu"}
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-center text-[11px] text-foreground/45">
          Đổi mục tiêu bất cứ lúc nào trên dashboard nha.
        </p>
      </footer>
    </div>
  );
}
