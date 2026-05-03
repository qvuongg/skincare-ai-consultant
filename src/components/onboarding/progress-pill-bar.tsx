"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Mục tiêu",
  "Ăn uống",
  "Môi trường",
  "Ngân sách",
  "Tuổi",
  "Tên",
  "Loại da",
  "Lifestyle",
  "Photo",
  "Review",
] as const;

type Props = {
  current: number;
  total?: number;
  onBack?: () => void;
  canBack?: boolean;
};

export function ProgressPillBar({
  current,
  total = STEP_LABELS.length,
  onBack,
  canBack,
}: Props) {
  const progress = (current + 1) / total;
  const label = STEP_LABELS[current] ?? "";

  return (
    <div
      className="flex items-center gap-3 rounded-full p-1.5"
      style={{
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow:
          "0 10px 30px rgba(31, 38, 135, 0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        aria-label="Quay lại"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/55 transition-opacity",
          canBack
            ? "bg-white/70 text-foreground/80 active:scale-95"
            : "bg-white/30 text-foreground/35"
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="relative flex flex-1 items-center">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(168,85,247,0.85), rgba(59,130,246,0.85), rgba(34,197,94,0.85))",
            }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-background">
        <span className="tabular-nums">
          {String(current + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span aria-hidden className="size-1 rounded-full bg-background/60" />
        <span className="normal-case tracking-normal">{label}</span>
      </div>
    </div>
  );
}
