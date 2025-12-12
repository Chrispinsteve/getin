import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ValuePropositions } from "@/components/value-propositions"
import { WhyDifferent } from "@/components/why-different"
import { EarningSimulator } from "@/components/earning-simulator"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ValuePropositions />
      <WhyDifferent />
      <EarningSimulator />
      <Testimonials />
      <Footer />
    </main>
  )
}

