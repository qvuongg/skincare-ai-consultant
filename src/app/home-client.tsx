"use client";

import { useRouter } from "next/navigation";

import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { MetricsGrid } from "@/components/landing/metrics-grid";
import { NavBar } from "@/components/landing/nav-bar";
import { ProcessTimeline } from "@/components/landing/process-timeline";
import { ReportPreview } from "@/components/landing/report-preview";
import { SliderDemo } from "@/components/landing/slider-demo";
import { SocialProof } from "@/components/landing/social-proof";
import { StickyMobileCta } from "@/components/landing/sticky-mobile-cta";
import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { useLowPower } from "@/lib/hooks/use-low-power";

// Composition root for the marketing landing page. All actual UI lives in
// `src/components/landing/*` — this file's only job is to wire the shared
// CTA + low-power state through to each section in the correct narrative
// order:
//   Hero → Process → Metrics → Slider Demo → Report Preview →
//   Social Proof → FAQ → Final CTA → Footer
//   (+ sticky mobile CTA floats above all of this on phone viewports)
export function HomeClient() {
  const router = useRouter();
  const { reduced, isMobile } = useLowPower();
  const startScan = () => router.push("/onboarding");

  // Parallax disabled on mobile (depth illusion barely reads at phone sizes,
  // per-frame scroll work is just as costly) and under prefers-reduced-motion.
  const noParallax = reduced || isMobile;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <MeshGradient />
      <NavBar onCta={startScan} reduced={reduced} />
      <main className="relative z-0 flex-1">
        <Hero onCta={startScan} reduced={reduced} noParallax={noParallax} />
        <ProcessTimeline />
        <MetricsGrid />
        <SliderDemo onCta={startScan} reduced={reduced} />
        <ReportPreview />
        <SocialProof />
        <div id="faq">
          <Faq />
        </div>
        <FinalCta onCta={startScan} reduced={reduced} />
        <Footer />
      </main>
      <StickyMobileCta onCta={startScan} reduced={reduced} />
    </div>
  );
}
