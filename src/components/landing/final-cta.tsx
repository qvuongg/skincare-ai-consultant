"use client";

import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { IrisCta } from "./iris-cta";
import { GLASS_LIGHT, GPU, SPRING } from "./landing-tokens";

// Final closing section. Oversized glass slab with an iris radial blob
// underneath the headline; below: budget-assurance copy, three trust chips,
// IrisCta linking back to /onboarding, and fine print.
export function FinalCta({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={SPRING}
        className="mx-auto max-w-5xl"
        style={GPU}
      >
        <div
          className="relative overflow-hidden rounded-[2rem] p-6 text-center sm:rounded-[2.5rem] sm:p-14 lg:p-20"
          style={{
            background: "rgba(255,255,255,0.42)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow:
              "0 50px 120px rgba(31,38,135,0.20), inset 0 1px 0 rgba(255,255,255,0.85)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-30%] size-[80vmin] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(59,130,246,0.10) 35%, transparent 70%)",
            }}
          />

          <div className="relative">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
              style={GLASS_LIGHT}
            >
              <Sparkles className="size-3 text-purple-600" strokeWidth={2.6} />
              Sẵn sàng chơi lớn?
            </span>

            <h2
              className="mt-4 text-balance text-[28px] font-semibold leading-[1.08] tracking-tight sm:mt-5 sm:text-[50px] lg:text-[64px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #1f2937 0%, #4b5563 50%, #111827 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 12px 36px rgba(31,38,135,0.10))",
              }}
            >
              Mika đã sẵn sàng. Còn bạn?
            </h2>

            <p className="mx-auto mt-4 max-w-[58ch] text-pretty text-[14px] leading-relaxed text-foreground/70 sm:mt-6 sm:text-[17px]">
              Mọi giải pháp sản phẩm đều được tối ưu hóa theo đúng hạn mức
              ngân sách cá nhân của bạn. Tuyệt đối không chèo kéo mỹ phẩm
              thừa, không upsell thẩm mỹ — Mika chỉ nói thật.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-2.5">
              <AssuranceChip icon={Wallet} text="Đúng ngân sách" />
              <AssuranceChip icon={ShieldCheck} text="Không upsell" />
              <AssuranceChip icon={Brain} text="AI khách quan" />
            </div>

            <div className="mt-8 flex justify-center sm:mt-10">
              <IrisCta
                label="Quét mặt & Nhận Routine miễn phí"
                onClick={onCta}
                reduced={reduced}
              />
            </div>

            <p className="mt-4 text-[12px] font-medium text-foreground/50 sm:mt-5">
              Miễn phí · Dưới 60 giây · Không cần cài app
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function AssuranceChip({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-foreground/75"
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      <Icon className="size-3.5 text-foreground/65" strokeWidth={2.4} />
      {text}
    </span>
  );
}
