"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Droplet, Dumbbell, Moon, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import {
  LiquidGlassSlider,
  type SliderVibe,
} from "@/components/onboarding/liquid-glass-slider";

import { IrisCta } from "./iris-cta";
import { GLASS_LIGHT, GPU, SPRING, fadeUp, stagger } from "./landing-tokens";

// Vibe ladders — short and Gen Z but never patronizing. Liquid Glass Slider
// re-keys its caption on the label string, so we only need to map value → vibe.
function waterVibe(v: number): SliderVibe {
  if (v <= 1)
    return { label: "Da đang phát tín hiệu SOS — uống ngay đi", emoji: "🆘" };
  if (v <= 4)
    return { label: "Đỡ rồi đó, nhưng vẫn khát ngấm ngầm", emoji: "🌵" };
  if (v <= 7) return { label: "Ổn — duy trì nhịp này nhé", emoji: "💧" };
  if (v <= 10)
    return { label: "Đẹp! Da đang glow rất tự nhiên", emoji: "✨" };
  return { label: "Aquaholic — level siêu cấp", emoji: "🌊" };
}

function sleepVibe(v: number): SliderVibe {
  if (v <= 3)
    return { label: "Cú đêm hardcore — da sắp khóc rồi", emoji: "🦉" };
  if (v <= 5)
    return { label: "Ngủ kiểu vá víu — chưa kịp phục hồi", emoji: "😴" };
  if (v <= 6)
    return { label: "Đủ tạm, nhưng chưa chạm tới deep sleep", emoji: "🛌" };
  if (v <= 8)
    return { label: "Sweet spot — collagen đang dệt êm ru", emoji: "🌙" };
  return { label: "Beauty sleep tier S+ — hoàng tộc da", emoji: "👑" };
}

function moveVibe(v: number): SliderVibe {
  if (v === 0)
    return { label: "Da đang thiếu vibe lưu thông máu", emoji: "🛋️" };
  if (v <= 2)
    return { label: "Nhẹ nhàng — đủ để máu chạy đều", emoji: "🚶‍♀️" };
  if (v <= 4)
    return { label: "Glow nội sinh đã được kích hoạt", emoji: "🔥" };
  if (v <= 6)
    return { label: "Sport queen — da hồng hào tự nhiên", emoji: "💪" };
  return { label: "Hết công suất — nhớ phục hồi đủ nhé", emoji: "🏆" };
}

// Weighted lifestyle composite. Not a real skin score — just a teaser so the
// reader sees one number that responds to all three sliders. Weights: water
// 35%, sleep 40%, movement 25%. Sleep clamps at 9h to penalize oversleep
// without going negative.
function lifestyleScore(water: number, sleep: number, move: number): number {
  const waterPart = (water / 12) * 35;
  const sleepPart = (Math.min(sleep, 9) / 9) * 40;
  const movePart = (move / 7) * 25;
  return Math.round(waterPart + sleepPart + movePart);
}

type ScoreBand = {
  label: string;
  message: string;
  ringFrom: string;
  ringTo: string;
  text: string;
};

function bandFor(score: number): ScoreBand {
  if (score < 40)
    return {
      label: "Báo động",
      message: "Da đang phải tự gồng. Mika sẽ tinh chỉnh routine để gỡ trước.",
      ringFrom: "#f43f5e",
      ringTo: "#fb923c",
      text: "#be123c",
    };
  if (score < 65)
    return {
      label: "Trung bình",
      message: "Cơ bản ổn, nhưng còn chỗ để nâng cấp. Đáng để soi sâu hơn.",
      ringFrom: "#f59e0b",
      ringTo: "#facc15",
      text: "#b45309",
    };
  if (score < 85)
    return {
      label: "Khá",
      message: "Bạn đang chăm tốt — Mika giúp bạn tối ưu nốt phần còn lại.",
      ringFrom: "#3b82f6",
      ringTo: "#22c55e",
      text: "#15803d",
    };
  return {
    label: "Tuyệt vời",
    message: "Lifestyle xịn. Da bạn xứng đáng một routine đỉnh không kém.",
    ringFrom: "#a855f7",
    ringTo: "#22c55e",
    text: "#7e22ce",
  };
}

export function SliderDemo({
  onCta,
  reduced,
}: {
  onCta: () => void;
  reduced: boolean;
}) {
  const [water, setWater] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [move, setMove] = useState(3);

  const score = useMemo(
    () => lifestyleScore(water, sleep, move),
    [water, sleep, move],
  );
  const band = bandFor(score);

  return (
    <section className="px-6 py-20 lg:py-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-3xl"
      >
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
            style={GLASS_LIGHT}
          >
            <span className="size-1.5 rounded-full bg-purple-500" />
            Trải nghiệm thực tế
          </span>
          <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]">
            Thấu hiểu làn da qua những con số trung thực.
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
            Kéo thử các thanh dưới đây — Mika sẽ phản ứng theo từng nhịp đời
            sống của bạn. Không thiên vị, không tô vẽ.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative rounded-[2rem] p-6 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow:
              "0 30px 70px rgba(31,38,135,0.14), inset 0 1px 0 rgba(255,255,255,0.85)",
            ...GPU,
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-16 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />
          <div className="space-y-5">
            <LiquidGlassSlider
              value={water}
              min={0}
              max={12}
              onChange={setWater}
              icon={Droplet}
              label="Lượng nước hằng ngày"
              display={`${water} ly`}
              fillFrom="rgba(59,130,246,0.55)"
              fillTo="rgba(56,189,248,0.85)"
              vibe={waterVibe(water)}
            />
            <LiquidGlassSlider
              value={sleep}
              min={0}
              max={12}
              onChange={setSleep}
              icon={Moon}
              label="Giấc ngủ mỗi đêm"
              display={`${sleep}h`}
              fillFrom="rgba(99,102,241,0.55)"
              fillTo="rgba(167,139,250,0.85)"
              vibe={sleepVibe(sleep)}
            />
            <LiquidGlassSlider
              value={move}
              min={0}
              max={7}
              onChange={setMove}
              icon={Dumbbell}
              label="Vận động mỗi tuần"
              display={`${move} buổi`}
              fillFrom="rgba(34,197,94,0.55)"
              fillTo="rgba(74,222,128,0.85)"
              vibe={moveVibe(move)}
            />
          </div>

          <ResultCard
            score={score}
            band={band}
            onCta={onCta}
            reduced={reduced}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Mini payoff card — shows a single composite "Lifestyle Vitality" number
// that reacts to the three sliders above, with a CTA pointing at the real
// scan flow. Re-keyed on `band.label` so the message + ring colors animate
// when the user crosses a band boundary.
function ResultCard({
  score,
  band,
  onCta,
  reduced,
}: {
  score: number;
  band: ScoreBand;
  onCta: () => void;
  reduced: boolean;
}) {
  return (
    <div
      className="mt-6 flex flex-col items-stretch gap-5 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      <ScoreRing score={score} band={band} reduced={reduced} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/55">
            Lifestyle Vitality
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={band.label}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: band.text,
                background: "rgba(255,255,255,0.7)",
                border: `1px solid ${band.text}33`,
              }}
            >
              {band.label}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={band.message}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 text-[13.5px] leading-relaxed text-foreground/70"
          >
            {band.message}
          </motion.p>
        </AnimatePresence>

        <p className="mt-3 text-[12px] leading-snug text-foreground/55">
          Đây chỉ là chỉ số sinh hoạt — chưa đo da. Quét mặt để biết
          <span className="font-semibold text-foreground/80">
            {" "}
            Skin Vitality Score
          </span>{" "}
          thật của bạn.
        </p>

        <div className="mt-4">
          <IrisCta
            label="Soi mặt thật ngay"
            onClick={onCta}
            reduced={reduced}
            size="md"
            icon={ArrowRight}
          />
        </div>
      </div>
    </div>
  );
}

// Ring uses an SVG circle stroke-dasharray to animate the arc length to the
// new score. Spring-animated for the bouncy feel that matches the page.
function ScoreRing({
  score,
  band,
  reduced,
}: {
  score: number;
  band: ScoreBand;
  reduced: boolean;
}) {
  const SIZE = 96;
  const STROKE = 8;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={band.ringFrom} />
            <stop offset="100%" stopColor={band.ringTo} />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,0.08)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={reduced ? { duration: 0 } : SPRING}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[26px] font-bold leading-none tabular-nums"
          style={{ color: band.text }}
        >
          {score}
        </span>
        <Sparkles
          className="mt-0.5 size-3"
          strokeWidth={2.6}
          style={{ color: band.text, opacity: 0.6 }}
        />
      </div>
    </div>
  );
}
