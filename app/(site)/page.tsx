import { HeroSection } from "@/components/sections/hero-section"
import { FeaturesSection } from "@/components/sections/features-section"
import { FAQSection } from "@/components/sections/faq-section"
import { HowItWorksSection } from "@/components/sections/how-it-works-section"
import { TrustSection } from "@/components/sections/trust-section"
import { CTASection } from "@/components/sections/cta-section"
import { ProductShowcase } from "@/components/sections/product-showcase"

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ProductShowcase />
      <TrustSection />
      <FAQSection />
      <CTASection />
    </main>
  )
}
