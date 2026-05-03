"use client";

import { motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Wallet } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

const MIN = 200_000;
const MAX = 2_000_000;
const STEP = 100_000;

function formatBudget(v: number): string {
  if (v >= MAX) return "2M+";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m.toFixed(m % 1 === 0 ? 0 : 1)}M`;
  }
  return `${Math.round(v / 1_000)}k`;
}

function budgetVibe(v: number): { label: string; tone: string } {
  if (v >= MAX)
    return {
      label: "Glow-up không giới hạn — Mika sẽ recommend full premium tier.",
      tone: "rgb(168, 85, 247)",
    };
  if (v >= 1_500_000)
    return {
      label: "Ngân sách rộng — đủ chỗ cho actives & dưỡng cao cấp.",
      tone: "rgb(99, 102, 241)",
    };
  if (v >= 800_000)
    return {
      label: "Mid-tier sweet spot — combo drugstore + 1 món xịn.",
      tone: "rgb(59, 130, 246)",
    };
  if (v >= 500_000)
    return {
      label: "Đủ để build routine cơ bản 4 bước, không gồng.",
      tone: "rgb(34, 197, 94)",
    };
  return {
    label: "Nhẹ ví — Mika sẽ ưu tiên local brand cost-effective.",
    tone: "rgb(234, 179, 8)",
  };
}

type Props = {
  value: number;
  onChange: (next: number) => void;
  onNext: () => void;
};

export function StepBudget({ value, onChange, onNext }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  // Drives the elastic-bounce when the user pushes past the max.
  const fillControls = useAnimationControls();
  const lastBouncedAtRef = useRef(0);

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const raw = MIN + ratio * (MAX - MIN);
      const stepped = Math.round(raw / STEP) * STEP;
      const clamped = Math.min(MAX, Math.max(MIN, stepped));

      // Trying to drag past the right edge while already at max → bounce.
      if (ratio > 1.02 && value === MAX) {
        const now = Date.now();
        if (now - lastBouncedAtRef.current > 500) {
          lastBouncedAtRef.current = now;
          fillControls.start({
            scaleX: [1, 1.04, 0.985, 1],
            transition: {
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            },
          });
        }
        return;
      }

      if (clamped !== value) onChange(clamped);
    },
    [value, onChange, fillControls]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  const vibe = budgetVibe(value);
  const display = formatBudget(value);

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 04 · Budget
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Ngân sách cho Skincare hàng tháng?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Kéo thanh trượt để chọn — Mika sẽ đề xuất sản phẩm trong khung của bạn,
          không bắt vung tay.
        </p>
      </header>

      <div className="mt-7 flex flex-col items-center">
        <motion.div
          key={value}
          initial={{ scale: 0.96, opacity: 0.6, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 20 }}
          className="text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Mỗi tháng
          </p>
          <p
            className="mt-1 text-[64px] font-bold leading-none tracking-tight tabular-nums text-foreground"
            style={{
              fontVariantNumeric: "tabular-nums",
              textShadow: "0 8px 24px rgba(31,38,135,0.18)",
            }}
          >
            {display}
            <span className="ml-1 align-baseline text-[20px] font-semibold text-foreground/55">
              ₫
            </span>
          </p>
        </motion.div>

        <motion.p
          key={vibe.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 max-w-[300px] text-center text-[12px] font-medium leading-snug"
          style={{ color: vibe.tone }}
        >
          {vibe.label}
        </motion.p>
      </div>

      <div className="mt-7">
        <div
          role="slider"
          aria-label="Ngân sách skincare hàng tháng"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          tabIndex={0}
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              onChange(Math.min(MAX, value + STEP));
              e.preventDefault();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              onChange(Math.max(MIN, value - STEP));
              e.preventDefault();
            }
          }}
          className="relative h-16 w-full cursor-pointer touch-none select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          style={{
            borderRadius: "1.5rem",
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.25), 0 8px 24px rgba(31,38,135,0.08)",
          }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-0 origin-left"
            style={{
              background:
                "linear-gradient(90deg, rgba(34,197,94,0.55) 0%, rgba(59,130,246,0.6) 55%, rgba(168,85,247,0.65) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
              width: `${pct}%`,
            }}
            animate={fillControls}
          />

          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
            }}
          />

          <div className="pointer-events-none relative z-10 flex h-full items-center justify-between px-5">
            <span className="flex items-center gap-2.5 text-foreground/75">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-white/70 text-foreground/80"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
              >
                <Wallet className="size-[18px]" />
              </span>
              <span className="text-[13px] font-semibold tracking-tight">
                Budget
              </span>
            </span>
            <span className="text-[15px] font-semibold tabular-nums tracking-tight text-foreground">
              {display}₫
            </span>
          </div>
        </div>

        <div className="mt-2 flex justify-between px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
          <span>200k</span>
          <span>1M</span>
          <span>2M+</span>
        </div>
      </div>

      <p className="mt-6 text-[11px] leading-snug text-foreground/45">
        🔒 Insider · Mika sẽ gợi ý sản phẩm trong khung giá phù hợp — và highlight
        item đáng đầu tư hơn drugstore.
      </p>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
