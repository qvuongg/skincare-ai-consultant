"use client";

import { useState } from "react";
import {
  FeaturesSection,
  HeroSection,
  SiteFooter,
} from "@/components/marketing/landing-sections";
import { SkinScanner } from "@/components/skin-scanner/skin-scanner";
import { OnboardingSlider } from "@/components/onboarding/onboarding-slider";
import { AnimatePresence, motion } from "framer-motion";

export default function HomePage() {
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleOnboardingComplete = async (data: any) => {
    setOnboardingData(data);
    
    // Gửi data lên API để lưu vào database
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }

    // Hiển thị scanner sau khi xong onboarding
    setShowScanner(true);
    
    // Scroll xuống scanner
    setTimeout(() => {
      document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="flex flex-1 flex-col">
      <HeroSection onStart={() => document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" })} />
      
      <section id="onboarding" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {!showScanner ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-[#D4AF37] mb-4">Làm quen một chút nhé!</h2>
                  <p className="text-gray-400">Hãy cho Casa Mika biết thêm về bạn để có kết quả chính xác nhất.</p>
                </div>
                <OnboardingSlider onComplete={handleOnboardingComplete} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mb-6">
                  <span className="text-xl font-bold italic">Cảm ơn {onboardingData?.user_name}! ✨</span>
                </div>
                <p className="text-gray-400 mb-8">Bây giờ, hãy chụp ảnh để bắt đầu phân tích da chuyên sâu.</p>
                <div className="animate-bounce">
                  <div className="w-1 h-12 bg-gradient-to-b from-[#D4AF37] to-transparent mx-auto rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <FeaturesSection />
      
      <section id="scanner" className="scroll-mt-20">
        <SkinScanner onboardingContext={onboardingData} />
      </section>

      <SiteFooter />
    </main>
  );
}

