import AnalysisFlowSection from "../components/landing/AnalysisFlowSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import CTASection from "../components/landing/CTASection";
import DisclaimerSection from "../components/landing/DisclaimerSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import Footer from "../components/landing/Footer";
import HeroSection from "../components/landing/HeroSection";
import ResultPreviewSection from "../components/landing/ResultPreviewSection";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <HeroSection />
      <AnalysisFlowSection />
      <FeaturesSection />
      <ResultPreviewSection />
      <BenefitsSection />
      <DisclaimerSection />
      <CTASection />
      <Footer />
    </main>
  );
}
