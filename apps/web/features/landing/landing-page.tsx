import { BenefitsSection } from "@/features/landing/components/benefits-section";
import { CallToActionSection } from "@/features/landing/components/call-to-action-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { PricingSection } from "@/features/landing/components/pricing-section";
import { TestimonialsSection } from "@/features/landing/components/testimonials-section";
import { WhyStorageHubSection } from "@/features/landing/components/why-storagehub-section";

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
