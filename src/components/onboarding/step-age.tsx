"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgeRangeId =
  | "u18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_plus";

type AgeBucket = {
  id: AgeRangeId;
  short: string;
  full: string;
  vibe: string;
};

const AGE_BUCKETS: AgeBucket[] = [
  {
    id: "u18",
    short: "<18",
    full: "Dưới 18",
    vibe: "Tuổi teen — ưu tiên trị mụn nhẹ & sunscreen ngon.",
  },
  {
    id: "18_24",
    short: "18–24",
    full: "18 – 24",
    vibe: "Sinh viên / mới đi làm — ưu tiên hạt dẻ, build nền tảng.",
  },
  {
    id: "25_34",
    short: "25–34",
    full: "25 – 34",
    vibe: "Glow đỉnh cao — bắt đầu thêm anti-oxidant & retinol nhẹ.",
  },
  {
    id: "35_44",
    short: "35–44",
    full: "35 – 44",
    vibe: "Phòng ngừa lão hóa sớm — peptide & SPF không thể thiếu.",
  },
  {
    id: "45_54",
    short: "45–54",
    full: "45 – 54",
    vibe: "Tập trung firming & dưỡng sâu, nâng đỡ structure.",
  },
  {
    id: "55_plus",
    short: "55+",
    full: "Trên 55",
    vibe: "Ưu tiên phục hồi, dưỡng ẩm sâu & treatment dịu nhẹ.",
  },
];

type Props = {
  value: AgeRangeId | null;
  onChange: (next: AgeRangeId) => void;
  onNext: () => void;
};

export function StepAge({ value, onChange, onNext }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = value
    ? AGE_BUCKETS.findIndex((b) => b.id === value)
    : -1;
  const current = selectedIndex >= 0 ? AGE_BUCKETS[selectedIndex] : null;

  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width)
      );
      const idx = Math.min(
        AGE_BUCKETS.length - 1,
        Math.max(0, Math.round(ratio * (AGE_BUCKETS.length - 1)))
      );
      const next = AGE_BUCKETS[idx];
      if (next.id !== value) onChange(next.id);
    },
    [value, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    setFromPointer(e.clientX);
  };

  // Thumb position is centered on the active stop. When nothing is selected,
  // park it at the start so the bar isn't visually empty.
  const safeIndex = selectedIndex < 0 ? 0 : selectedIndex;
  const stopPct = (safeIndex / (AGE_BUCKETS.length - 1)) * 100;

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 05 · Age
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Bạn đang ở độ tuổi nào?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Mika sẽ chọn active ingredients phù hợp với từng giai đoạn của da.
        </p>
      </header>

      <div className="mt-7 flex flex-col items-center">
        <motion.p
          key={current?.full ?? "empty"}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 480, damping: 22 }}
          className="text-[44px] font-bold leading-none tracking-tight text-foreground"
          style={{ textShadow: "0 8px 24px rgba(31,38,135,0.18)" }}
        >
          {current?.full ?? "—"}
        </motion.p>
        <motion.p
          key={`vibe-${current?.id ?? "empty"}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 max-w-[300px] text-center text-[13px] font-medium leading-snug text-foreground/65"
        >
          {current?.vibe ?? "Kéo thanh trượt để Mika nhận diện giai đoạn da."}
        </motion.p>
      </div>

      <div className="mt-7">
        <div
          role="slider"
          aria-label="Độ tuổi"
          aria-valuemin={0}
          aria-valuemax={AGE_BUCKETS.length - 1}
          aria-valuenow={safeIndex}
          aria-valuetext={current?.full ?? "Chưa chọn"}
          tabIndex={0}
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={(e) => {
            const i = selectedIndex < 0 ? 0 : selectedIndex;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              const next = Math.min(AGE_BUCKETS.length - 1, i + 1);
              onChange(AGE_BUCKETS[next].id);
              e.preventDefault();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              const next = Math.max(0, i - 1);
              onChange(AGE_BUCKETS[next].id);
              e.preventDefault();
            }
          }}
          className="relative h-20 w-full cursor-pointer touch-none select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          style={{
            borderRadius: "1.75rem",
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.25), 0 8px 24px rgba(31,38,135,0.08)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
            }}
          />

          {/* Filled segment up to the selected stop */}
          {selectedIndex >= 0 && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(244,114,182,0.55), rgba(168,85,247,0.6) 60%, rgba(99,102,241,0.65))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              animate={{ width: `${stopPct}%` }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
                mass: 0.7,
              }}
            />
          )}

          {/* Stop ticks */}
          <div className="pointer-events-none absolute inset-x-5 top-3 flex items-center justify-between">
            {AGE_BUCKETS.map((b, i) => {
              const isActive = i === selectedIndex;
              const isPassed = selectedIndex >= 0 && i <= selectedIndex;
              return (
                <span
                  key={b.id}
                  aria-hidden
                  className={cn(
                    "block size-1.5 rounded-full transition-colors",
                    isActive
                      ? "bg-foreground"
                      : isPassed
                      ? "bg-white"
                      : "bg-foreground/25"
                  )}
                />
              );
            })}
          </div>

          {/* Thumb */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            initial={false}
            animate={{
              left: `calc(${stopPct}% * 0.86 + 7%)`,
              opacity: selectedIndex >= 0 ? 1 : 0.4,
              scale: selectedIndex >= 0 ? 1 : 0.85,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 26,
              mass: 0.7,
            }}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow:
                "0 10px 28px rgba(31,38,135,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.06)",
            }}
          >
            <span className="text-[11px] font-bold tabular-nums tracking-tight text-foreground/85">
              {current?.short ?? "—"}
            </span>
          </motion.span>
        </div>

        {/* Stop labels under the track */}
        <div className="mt-2 flex justify-between px-1">
          {AGE_BUCKETS.map((b, i) => {
            const isActive = i === selectedIndex;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange(b.id)}
                className={cn(
                  "rounded-full px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-foreground/40 hover:text-foreground/70"
                )}
              >
                {b.short}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-[11px] leading-snug text-foreground/45">
        🔒 Insider · Tuổi tác quyết định active ingredients Mika đề xuất —
        chuẩn từng giai đoạn da.
      </p>

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
