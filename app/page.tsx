import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { FAQSection } from "@/components/faq-section"

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
    </main>
  )
}
