"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Snowflake, 
  Sun, 
  Droplets, 
  Moon, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  ShieldCheck,
  Coffee,
  Zap
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
  "Retinol", "BHA", "AHA", "Vitamin C", "Niacinamide", "Hyaluronic Acid", "Benzoyl Peroxide", "None"
];

const GOALS = [
  { id: "acne_treatment", label: "Trị mụn", icon: <Zap className="size-4" /> },
  { id: "brightening", label: "Sáng da", icon: <Sparkles className="size-4" /> },
  { id: "anti_aging", label: "Chống lão hóa", icon: <ShieldCheck className="size-4" /> },
  { id: "hydration", label: "Cấp ẩm", icon: <Droplets className="size-4" /> }
];

export function OnboardingSlider({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [data, setData] = useState<Partial<OnboardingData>>({
    user_name: "",
    current_treatments: [],
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  // Step 1: Auto-Location
  useEffect(() => {
    if (step === 2 && !data.location) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Giả lập lấy tên thành phố từ lat/long
            const location = "Đà Nẵng"; 
            setData(prev => ({ 
              ...prev, 
              location,
              weather_context: { uv_index: 8, humidity: "high" }
            }));
            setFeedback(`Tuyệt vời! Mình thấy bạn đang ở ${location}. Hãy cẩn thận với nắng miền Trung nhé! ☀️`);
          },
          () => {
            setData(prev => ({ ...prev, location: "Việt Nam" }));
            setFeedback("Không sao, mình sẽ tư vấn dựa trên khí hậu Việt Nam chung nhé! 🇻🇳");
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

  const handleChoice = (key: string, value: any, message: string, isFinalStep = false) => {
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
      ? current.filter(i => i !== item)
      : [...current, item];
    setData(prev => ({ ...prev, current_treatments: next }));
  };

  const slideVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  };

  return (
    <div className="mx-auto max-w-lg w-full p-6 bg-black text-white rounded-2xl border border-[#D4AF37]/30 shadow-2xl overflow-hidden relative">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full px-6 pt-4">
        <Progress value={progress} className="h-1 bg-white/10" />
      </div>

      <div className="mt-8 min-h-[400px] flex flex-col justify-center">
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
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#D4AF37]">Chào bạn! 👋</h2>
                <p className="text-gray-400">Chúng mình xưng hô với nhau thế nào nhỉ?</p>
                <input
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-[#D4AF37] text-2xl py-2 focus:outline-none placeholder:text-gray-700"
                  placeholder="Tên của bạn..."
                  value={data.user_name}
                  onChange={(e) => setData({ ...data, user_name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && data.user_name && nextStep()}
                />
                {data.user_name && (
                  <Button 
                    onClick={nextStep}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B8962E] font-bold"
                  >
                    Tiếp tục <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Step 2: Location (Auto) */}
            {step === 2 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-[#D4AF37]/10 animate-pulse">
                    <MapPin className="size-12 text-[#D4AF37]" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Đang định vị...</h2>
                <p className="text-[#D4AF37] font-medium min-h-[3rem]">{feedback}</p>
                {data.location && (
                   <Button onClick={nextStep} className="bg-[#D4AF37] text-black hover:bg-[#B8962E] font-bold">
                    Tiếp tục thôi!
                  </Button>
                )}
              </div>
            )}

            {/* Step 3: Environment */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">Môi trường làm việc?</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleChoice("environment", "office", "Máy lạnh làm khô da lắm đấy, nhớ cấp ẩm nhé! ❄️")}
                    className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-[#D4AF37] transition-all flex flex-col items-center gap-3"
                  >
                    <Snowflake className="size-10 text-blue-400" />
                    <span>Văn phòng</span>
                  </button>
                  <button
                    onClick={() => handleChoice("environment", "outdoor", "Nắng gắt quá, đừng quên kem chống nắng nha! ☀️")}
                    className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-[#D4AF37] transition-all flex flex-col items-center gap-3"
                  >
                    <Sun className="size-10 text-orange-400" />
                    <span>Ngoài trời</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Habits */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">Thói quen sinh hoạt?</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <p className="mb-3 flex items-center gap-2"><Droplets className="size-4 text-blue-400" /> Lượng nước uống?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setData({...data, habits: {...(data.habits || {sleep: ""}), water: "low"}})}>Ít</Button>
                      <Button variant="outline" size="sm" onClick={() => setData({...data, habits: {...(data.habits || {sleep: ""}), water: "normal"}})}>Đủ</Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <p className="mb-3 flex items-center gap-2"><Moon className="size-4 text-purple-400" /> Giấc ngủ?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setData({...data, habits: {...(data.habits || {water: ""}), sleep: "late"}})}>Cú đêm</Button>
                      <Button variant="outline" size="sm" onClick={() => setData({...data, habits: {...(data.habits || {water: ""}), sleep: "enough"}})}>Ngủ đủ</Button>
                    </div>
                  </div>
                  <Button 
                    disabled={!data.habits?.water || !data.habits?.sleep}
                    onClick={() => handleChoice("habits", data.habits, "Giấc ngủ là liều thuốc tiên cho làn da đấy! ✨")}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B8962E] font-bold"
                  >
                    Tiếp tục
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Treatments */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">Bạn đang dùng gì?</h2>
                <div className="flex flex-wrap gap-2">
                  {TREATMENTS.map(item => (
                    <Badge
                      key={item}
                      variant={data.current_treatments?.includes(item) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer py-2 px-3 text-sm",
                        data.current_treatments?.includes(item) && "bg-[#D4AF37] text-black"
                      )}
                      onClick={() => toggleTreatment(item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
                <Button 
                  onClick={() => handleChoice("current_treatments", data.current_treatments, "Wow, bạn cũng 'sành' skincare đấy chứ! 🧪")}
                  className="w-full bg-[#D4AF37] text-black hover:bg-[#B8962E] font-bold"
                >
                  Xong rồi
                </Button>
              </div>
            )}

            {/* Step 6: Goal */}
            {step === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">Mục tiêu lớn nhất?</h2>
                <div className="grid gap-3">
                  {GOALS.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => handleChoice("primary_goal", goal.id, "Mục tiêu đã rõ! Hãy để mình giúp bạn tỏa sáng. 🌟", true)}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-[#D4AF37] transition-all flex items-center gap-4 text-left"
                    >
                      <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                        {goal.icon}
                      </div>
                      <span className="font-medium">{goal.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-sm text-center font-medium"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
