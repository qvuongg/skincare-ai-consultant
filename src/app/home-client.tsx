"use client";

import { useRouter } from "next/navigation";

import { BeforeAfter } from "@/components/landing/before-after";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { MetricsGrid } from "@/components/landing/metrics-grid";
import { NavBar } from "@/components/landing/nav-bar";
import { ProcessTimeline } from "@/components/landing/process-timeline";
import { ReportPreview } from "@/components/landing/report-preview";
import { SkinMacro } from "@/components/landing/skin-macro";
import { SliderDemo } from "@/components/landing/slider-demo";
import { SocialProof } from "@/components/landing/social-proof";
import { StickyMobileCta } from "@/components/landing/sticky-mobile-cta";
import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { useLowPower } from "@/lib/hooks/use-low-power";

// Composition root for the marketing landing page. All actual UI lives in
// `src/components/landing/*` — this file's only job is to wire the shared
// CTA + low-power state through to each section in the correct narrative
// order:
//   Hero (FaceScanVisualizer) → Process (dark) → Metrics (face heatmap) →
//   SkinMacro → SliderDemo (payoff) → ReportPreview → BeforeAfter (slider) →
//   SocialProof (horizontal scroll) → FAQ (warm panel) → FinalCta → Footer
//   (+ sticky mobile CTA floats above all of this on phone viewports)
export function HomeClient() {
  const router = useRouter();
  const { reduced } = useLowPower();
  const startScan = () => router.push("/onboarding");

  return (
    <div className="relative flex min-h-dvh flex-col">
      <MeshGradient />
      <NavBar onCta={startScan} reduced={reduced} />
      <main className="relative z-0 flex-1">
        <Hero onCta={startScan} reduced={reduced} />
        <ProcessTimeline />
        <MetricsGrid />
        <SkinMacro />
        <SliderDemo onCta={startScan} reduced={reduced} />
        <ReportPreview />
        <BeforeAfter />
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
