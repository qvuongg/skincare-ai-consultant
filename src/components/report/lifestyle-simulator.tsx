"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Moon,
  GlassWater,
  Sun,
  Utensils,
  Dumbbell,
  Sparkles,
  RotateCcw,
  Check,
  type LucideIcon,
} from "lucide-react";

import {
  getScoreBand,
  type CompositeBreakdown,
  type LifestyleModifier,
} from "@/lib/scoring/engine";
import type { ReportContext } from "./insights";
import { REPORT_SPRING } from "./types";

type SimulatorHabit = {
  id: string;
  icon: LucideIcon;
  title: string;
  gainPoints: number;
  explanation: string;
  defaultActive: boolean;
};

type Props = {
  initialScore: number;
  compositeScore: number;
  mods: LifestyleModifier[];
  ctx: ReportContext;
  breakdown: CompositeBreakdown;
};

export function LifestyleSimulator({
  initialScore,
  compositeScore,
  mods,
  ctx,
}: Props) {
  // 1. Identify which negative modifiers exist in the user's report
  const hasNegativeSleep = mods.some((m) => m.factor === "sleep" && m.value < 0);
  const hasNegativeWater = mods.some((m) => m.factor === "water" && m.value < 0);
  const hasNegativeDiet = mods.some((m) => m.factor === "diet" && m.value < 0);
  const hasNegativeSunscreen = mods.some(
    (m) => m.factor === "sunscreen" && m.value < 0
  );
  const hasExerciseBonus = mods.some(
    (m) => m.factor === "exercise" && m.value > 0
  );

  // 2. Build the list of actionable habits to simulate
  const habitList: SimulatorHabit[] = useMemo(() => {
    const list: SimulatorHabit[] = [];

    // Water habit
    if (hasNegativeWater || (ctx.waterLiters !== null && ctx.waterLiters < 2)) {
      list.push({
        id: "water",
        icon: GlassWater,
        title: "Uống đủ 2L – 2.5L nước/ngày",
        gainPoints: hasNegativeWater ? 8 : 3, // recover 5 + gain 3
        explanation: "Cấp nước tầng sâu, giảm khô tróc và củng cố độ đàn hồi",
        defaultActive: false,
      });
    }

    // Sleep habit
    if (hasNegativeSleep || (ctx.sleepHours !== null && ctx.sleepHours < 7)) {
      list.push({
        id: "sleep",
        icon: Moon,
        title: "Ngủ đủ 7–8 tiếng (ngủ trước 23h)",
        gainPoints: hasNegativeSleep ? 8 : 3, // recover 5 + gain 3
        explanation: "Hạ cortisol, kiềm dầu thừa và thúc đẩy chu trình thay da sinh học",
        defaultActive: false,
      });
    }

    // Sunscreen habit
    if (
      hasNegativeSunscreen ||
      ctx.sunscreenUse === "never" ||
      ctx.sunscreenUse === "sometimes"
    ) {
      list.push({
        id: "sunscreen",
        icon: Sun,
        title: "Thoa kem chống nắng mỗi sáng",
        gainPoints: hasNegativeSunscreen ? 8 : 4,
        explanation: "Chặn 98% tia UVA/UVB, ngăn ngừa đốm nâu và lão hóa sớm",
        defaultActive: false,
      });
    }

    // Diet habit
    if (hasNegativeDiet) {
      list.push({
        id: "diet",
        icon: Utensils,
        title: "Giảm đồ ngọt, cay nóng & ăn healthy",
        gainPoints: 10, // recover 5 + gain 5
        explanation: "Giảm bùng phát bã nhờn, hạn chế phản ứng viêm và mụn mủ",
        defaultActive: false,
      });
    }

    // Exercise habit (if not already getting the 3+ exercise bonus)
    if (!hasExerciseBonus) {
      list.push({
        id: "exercise",
        icon: Dumbbell,
        title: "Vận động thể thao 3+ buổi/tuần",
        gainPoints: 3,
        explanation: "Tăng lưu thông mao mạch da, mang dưỡng chất nuôi tế bào hồng hào",
        defaultActive: false,
      });
    }

    // Ensure at least 3 items for full interactivity
    if (list.length < 3 && !list.some((h) => h.id === "water")) {
      list.push({
        id: "water",
        icon: GlassWater,
        title: "Uống đều 2L nước mỗi ngày",
        gainPoints: 3,
        explanation: "Bổ sung lượng nước hao hụt qua biểu bì khi ngồi máy lạnh",
        defaultActive: false,
      });
    }
    if (list.length < 3 && !list.some((h) => h.id === "sleep")) {
      list.push({
        id: "sleep",
        icon: Moon,
        title: "Duy trì giấc ngủ sâu 7–8 tiếng",
        gainPoints: 3,
        explanation: "Khung giờ vàng 23h-3h sáng phục hồi màng bảo vệ da",
        defaultActive: false,
      });
    }

    return list.slice(0, 4); // Keep top 3-4 most impactful
  }, [
    hasNegativeWater,
    hasNegativeSleep,
    hasNegativeSunscreen,
    hasNegativeDiet,
    hasExerciseBonus,
    ctx.waterLiters,
    ctx.sleepHours,
    ctx.sunscreenUse,
  ]);

  // State: Set of active habit IDs
  const [activeHabits, setActiveHabits] = useState<Set<string>>(new Set());

  const toggleHabit = (id: string) => {
    setActiveHabits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetAll = () => setActiveHabits(new Set());

  // Calculate simulated score
  const gainedPoints = useMemo(() => {
    let total = 0;
    for (const h of habitList) {
      if (activeHabits.has(h.id)) {
        total += h.gainPoints;
      }
    }
    return total;
  }, [activeHabits, habitList]);

  const simulatedScore = Math.min(100, Math.round(initialScore + gainedPoints));
  const simulatedBand = getScoreBand(simulatedScore);
  const isUpgraded = simulatedScore > initialScore;

  return (
    <div
      className="relative overflow-hidden rounded-[26px] p-5"
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(245, 243, 255, 0.45) 50%, rgba(255, 255, 255, 0.7) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.75)",
        boxShadow:
          "0 14px 34px rgba(31, 38, 135, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Top light reflection line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
            <SlidersHorizontal className="size-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-bold tracking-tight text-foreground">
              Bộ Mô Phỏng Thói Quen (What-If)
            </h3>
            <p className="text-[11px] text-foreground/60">
              Bật công tắc để xem điểm da tăng vọt trong tương lai
            </p>
          </div>
        </div>

        {activeHabits.size > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-foreground/60 transition-colors hover:bg-white active:scale-95"
          >
            <RotateCcw className="size-3" /> Đặt lại
          </button>
        )}
      </div>

      {/* Interactive Toggle List */}
      <div className="mt-4 space-y-2.5">
        {habitList.map((habit) => {
          const isActive = activeHabits.has(habit.id);
          const Icon = habit.icon;

          return (
            <motion.div
              key={habit.id}
              layout
              onClick={() => toggleHabit(habit.id)}
              className="group relative flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3.5 transition-all select-none"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(240, 253, 244, 0.85), rgba(255, 255, 255, 0.9))"
                  : "rgba(255, 255, 255, 0.5)",
                border: isActive
                  ? "1.5px solid rgba(52, 211, 153, 0.7)"
                  : "1px solid rgba(255, 255, 255, 0.65)",
                boxShadow: isActive
                  ? "0 6px 18px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255,255,255,0.95)"
                  : "0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {/* Left icon + text */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                  style={{
                    background: isActive
                      ? "rgba(16, 185, 129, 0.18)"
                      : "rgba(255, 255, 255, 0.8)",
                    color: isActive ? "#059669" : "inherit",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <Icon className="size-4 text-foreground/75" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-foreground leading-snug">
                      {habit.title}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.2 text-[10px] font-bold"
                      style={{
                        background: isActive
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(245, 158, 11, 0.15)",
                        color: isActive ? "#047857" : "#b45309",
                      }}
                    >
                      +{habit.gainPoints} điểm
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/60 line-clamp-1">
                    {habit.explanation}
                  </p>
                </div>
              </div>

              {/* iOS-Style Toggle Switch */}
              <div
                className="relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : "rgba(0, 0, 0, 0.12)",
                }}
              >
                <motion.div
                  layout
                  transition={REPORT_SPRING}
                  className="flex size-5 items-center justify-center rounded-full bg-white shadow-md"
                  style={{
                    transform: isActive ? "translateX(20px)" : "translateX(0px)",
                  }}
                >
                  {isActive && <Check className="size-3 text-emerald-600 stroke-[3]" />}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Simulation Result Card */}
      <AnimatePresence>
        <motion.div
          key={simulatedScore}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-2xl p-3.5 flex items-center justify-between gap-3"
          style={{
            background: isUpgraded
              ? "linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(209, 250, 229, 0.7))"
              : "rgba(255, 255, 255, 0.5)",
            border: isUpgraded
              ? "1px solid rgba(52, 211, 153, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.6)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-10 items-center justify-center rounded-full text-[18px] font-black"
              style={{
                background: isUpgraded ? "#10B981" : "rgba(0,0,0,0.06)",
                color: isUpgraded ? "#FFFFFF" : "inherit",
              }}
            >
              {simulatedScore}
            </span>

            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-bold text-foreground">
                  Điểm Giả Lập
                </p>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {simulatedBand.emoji} {simulatedBand.label}
                </span>
              </div>
              <p className="text-[10px] text-foreground/60">
                {isUpgraded
                  ? `Mở khóa thành công +${gainedPoints} điểm phục hồi`
                  : "Chạm các công tắc trên để kiểm tra kết quả"}
              </p>
            </div>
          </div>

          {isUpgraded && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 rounded-xl bg-emerald-600/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800"
            >
              <Sparkles className="size-3.5 text-emerald-600" />
              14 ngày đạt chuẩn
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
