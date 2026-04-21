"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Snowflake,
  Sun,
  Droplets,
  Moon,
  ArrowRight,
  MapPin,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OnboardingData {
  user_name: string;
  location: string;
  weather_context: { uv_index: number; humidity: string };
  environment: string;
  habits: { water: string; sleep: string };
  current_treatments: string[];
  primary_goal: string;
  timestamp: string;
}

const TREATMENTS = [
  "Retinol",
  "BHA",
  "AHA",
  "Vitamin C",
  "Niacinamide",
  "Hyaluronic Acid",
  "Benzoyl Peroxide",
  "None",
];

const GOALS = [
  { id: "acne_treatment", label: "Trị mụn", icon: <Zap className="size-4" /> },
  { id: "brightening", label: "Sáng da", icon: <Sparkles className="size-4" /> },
  { id: "anti_aging", label: "Chống lão hóa", icon: <ShieldCheck className="size-4" /> },
  { id: "hydration", label: "Cấp ẩm", icon: <Droplets className="size-4" /> },
];

export function OnboardingSlider({
  onComplete,
}: {
  onComplete: (data: OnboardingData) => void;
}) {
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [data, setData] = useState<Partial<OnboardingData>>({
    user_name: "",
    current_treatments: [],
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    if (step === 2 && !data.location) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async () => {
            const location = "Đà Nẵng";
            setData((prev) => ({
              ...prev,
              location,
              weather_context: { uv_index: 8, humidity: "high" },
            }));
            setFeedback(
              `Tuyệt vời! Mình thấy bạn đang ở ${location}. Hãy cẩn thận với nắng miền Trung nhé! ☀️`
            );
          },
          () => {
            setData((prev) => ({ ...prev, location: "Việt Nam" }));
            setFeedback(
              "Không sao, mình sẽ tư vấn dựa trên khí hậu Việt Nam chung nhé! 🇻🇳"
            );
          }
        );
      }
    }
  }, [step]);

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setFeedback("");
    } else {
      const finalData = {
        ...data,
        timestamp: new Date().toISOString(),
      } as OnboardingData;
      onComplete(finalData);
    }
  };

  const handleChoice = (
    key: string,
    value: any,
    message: string,
    isFinalStep = false
  ) => {
    const newData = { ...data, [key]: value };
    setData(newData);
    setFeedback(message);
    if (isFinalStep) {
      const finalData = {
        ...newData,
        timestamp: new Date().toISOString(),
      } as OnboardingData;
      onComplete(finalData);
    } else {
      setTimeout(nextStep, 1000);
    }
  };

  const toggleTreatment = (item: string) => {
    const current = data.current_treatments || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setData((prev) => ({ ...prev, current_treatments: next }));
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  const tileClass =
    "group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-foreground shadow-sm ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm ring-1 ring-foreground/5 sm:p-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bước {step} / {totalSteps}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />

      <div className="mt-8 flex min-h-[400px] flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Badge
                    variant="secondary"
                    className="border border-border bg-secondary/80"
                  >
                    Chào bạn 👋
                  </Badge>
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Chúng mình xưng hô với nhau thế nào nhỉ?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Hãy để Casa Mika biết tên bạn để buổi tư vấn thân thiện hơn.
                  </p>
                </div>
                <input
                  autoFocus
                  className="w-full border-b-2 border-border bg-transparent py-2 text-2xl text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  placeholder="Tên của bạn..."
                  value={data.user_name}
                  onChange={(e) =>
                    setData({ ...data, user_name: e.target.value })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && data.user_name && nextStep()
                  }
                />
                {data.user_name && (
                  <Button
                    size="lg"
                    onClick={nextStep}
                    className="w-full"
                  >
                    Tiếp tục <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                    <MapPin className="size-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Đang định vị...
                  </h2>
                  <p className="min-h-[3rem] text-sm text-muted-foreground">
                    {feedback ||
                      "Chúng mình sẽ điều chỉnh tư vấn theo khí hậu nơi bạn sống."}
                  </p>
                </div>
                {data.location && (
                  <Button size="lg" onClick={nextStep}>
                    Tiếp tục <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Môi trường làm việc?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Thông tin này giúp dự đoán các yếu tố tác động tới làn da.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleChoice(
                        "environment",
                        "office",
                        "Máy lạnh làm khô da lắm đấy, nhớ cấp ẩm nhé! ❄️"
                      )
                    }
                    className={tileClass}
                  >
                    <span className="flex size-12 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                      <Snowflake className="size-6" />
                    </span>
                    <span className="text-sm font-medium">Văn phòng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChoice(
                        "environment",
                        "outdoor",
                        "Nắng gắt quá, đừng quên kem chống nắng nha! ☀️"
                      )
                    }
                    className={tileClass}
                  >
                    <span className="flex size-12 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5">
                      <Sun className="size-6" />
                    </span>
                    <span className="text-sm font-medium">Ngoài trời</span>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Thói quen sinh hoạt?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Nền tảng sức khỏe bên trong quyết định rất lớn đến làn da.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Droplets className="size-4 text-chart-2" /> Lượng nước uống?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          data.habits?.water === "low" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setData({
                            ...data,
                            habits: {
                              ...(data.habits || { sleep: "" }),
                              water: "low",
                            },
                          })
                        }
                      >
                        Ít
                      </Button>
                      <Button
                        variant={
                          data.habits?.water === "normal"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setData({
                            ...data,
                            habits: {
                              ...(data.habits || { sleep: "" }),
                              water: "normal",
                            },
                          })
                        }
                      >
                        Đủ
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Moon className="size-4 text-chart-3" /> Giấc ngủ?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          data.habits?.sleep === "late" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setData({
                            ...data,
                            habits: {
                              ...(data.habits || { water: "" }),
                              sleep: "late",
                            },
                          })
                        }
                      >
                        Cú đêm
                      </Button>
                      <Button
                        variant={
                          data.habits?.sleep === "enough"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setData({
                            ...data,
                            habits: {
                              ...(data.habits || { water: "" }),
                              sleep: "enough",
                            },
                          })
                        }
                      >
                        Ngủ đủ
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    disabled={!data.habits?.water || !data.habits?.sleep}
                    onClick={() =>
                      handleChoice(
                        "habits",
                        data.habits,
                        "Giấc ngủ là liều thuốc tiên cho làn da đấy! ✨"
                      )
                    }
                    className="w-full"
                  >
                    Tiếp tục <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Bạn đang dùng gì?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Chọn tất cả hoạt chất bạn đang sử dụng trong chu trình hiện tại.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TREATMENTS.map((item) => {
                    const selected = data.current_treatments?.includes(item);
                    return (
                      <Badge
                        key={item}
                        variant={selected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-sm transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                        )}
                        onClick={() => toggleTreatment(item)}
                      >
                        {item}
                      </Badge>
                    );
                  })}
                </div>
                <Button
                  size="lg"
                  onClick={() =>
                    handleChoice(
                      "current_treatments",
                      data.current_treatments,
                      "Wow, bạn cũng 'sành' skincare đấy chứ! 🧪"
                    )
                  }
                  className="w-full"
                >
                  Xong rồi <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Mục tiêu lớn nhất?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Casa Mika sẽ ưu tiên đề xuất xoay quanh mục tiêu này của bạn.
                  </p>
                </div>
                <div className="grid gap-3">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() =>
                        handleChoice(
                          "primary_goal",
                          goal.id,
                          "Mục tiêu đã rõ! Hãy để mình giúp bạn tỏa sáng. 🌟",
                          true
                        )
                      }
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-sm ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {goal.icon}
                      </span>
                      <span className="text-sm font-medium">{goal.label}</span>
                      <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {feedback && step !== 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center text-sm font-medium text-primary"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
