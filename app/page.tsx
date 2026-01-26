import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { FAQSection } from "@/components/faq-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TrustSection } from "@/components/trust-section"
import { CTASection } from "@/components/cta-section"
import { ProductShowcase } from "@/components/product-showcase"

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
