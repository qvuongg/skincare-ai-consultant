import {
  FeaturesSection,
  HeroSection,
  SiteFooter,
} from "@/components/marketing/landing-sections";
import { SkinScanner } from "@/components/skin-scanner/skin-scanner";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <FeaturesSection />
      <SkinScanner />
      <SiteFooter />
    </main>
  );
}
