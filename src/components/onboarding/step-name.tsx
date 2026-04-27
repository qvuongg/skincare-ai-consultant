"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onNext: () => void;
};

export function StepName({ value, onChange, onNext }: Props) {
  const trimmed = value.trim();
  const canContinue = trimmed.length >= 1;

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 02 · Name
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Casa Mika gọi bạn là gì nhỉ?
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Mika sẽ tag tên bạn xuyên suốt routine — nghe vibe hơn nhiều 💬
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canContinue) onNext();
        }}
        className="mt-8 flex flex-1 flex-col"
      >
        <label
          htmlFor="onb-name"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/50"
        >
          Tên hoặc nickname
        </label>
        <div
          className="mt-2 flex items-center gap-3 px-5"
          style={{
            borderRadius: "1.75rem",
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(30px) saturate(180%)",
            WebkitBackdropFilter: "blur(30px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.65)",
            boxShadow:
              "0 14px 36px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
          }}
        >
          <Sparkles
            aria-hidden
            className="size-5 shrink-0 text-foreground/45"
          />
          <input
            id="onb-name"
            type="text"
            inputMode="text"
            autoComplete="name"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="Ví dụ: Linh, Kira, Bún…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={32}
            className="h-16 flex-1 bg-transparent text-[22px] font-semibold tracking-tight text-foreground placeholder:font-medium placeholder:text-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-2 text-[11px] text-foreground/45">
          Tối đa 32 ký tự — không bắt buộc dùng tên thật.
        </p>

        <footer className="mt-auto flex flex-col gap-2 pt-8">
          <Button
            type="submit"
            size="lg"
            disabled={!canContinue}
            className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
          >
            {canContinue ? `Hi ${trimmed}, đi tiếp nào` : "Nhập tên để tiếp tục"}
            <ArrowRight className="size-4" />
          </Button>
        </footer>
      </form>
    </div>
  );
}
