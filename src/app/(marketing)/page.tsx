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
      
      <section
        id="onboarding"
        className="border-b border-border bg-gradient-to-b from-background to-muted/40 px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            {!showScanner ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-10 text-center">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Làm quen một chút nhé!
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                    Hãy cho Casa Mika biết thêm về bạn để có kết quả chính xác nhất.
                  </p>
                </div>
                <OnboardingSlider onComplete={handleOnboardingComplete} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="mb-6 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-primary">
                  <span className="text-lg font-semibold">
                    Cảm ơn {onboardingData?.user_name}! ✨
                  </span>
                </div>
                <p className="mb-8 text-sm text-muted-foreground sm:text-base">
                  Bây giờ, hãy chụp ảnh để bắt đầu phân tích da chuyên sâu.
                </p>
                <div className="animate-bounce">
                  <div className="mx-auto h-12 w-1 rounded-full bg-gradient-to-b from-primary to-transparent" />
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

