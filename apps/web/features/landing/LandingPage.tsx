import { BenefitsSection } from "@/features/landing/components/BenefitsSection";
import { CallToActionSection } from "@/features/landing/components/CallToActionSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { PricingSection } from "@/features/landing/components/PricingSection";
import { TestimonialsSection } from "@/features/landing/components/TestimonialsSection";
import { WhyStorageHubSection } from "@/features/landing/components/WhyStorageHubSection";

export function LandingPage() {
  return (
    <div
      id="top"
      data-landing
      className="flex min-h-screen flex-col overflow-x-clip bg-brand-pageBg text-neutral-main"
    >
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <WhyStorageHubSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CallToActionSection />
      </main>
      <LandingFooter />
    </div>
  );
}
