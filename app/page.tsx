import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroScanner } from "@/components/landing/HeroScanner";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between cyber-bg">
      <Navbar />

      <main className="flex-1 w-full">
        {/* Hero Section with Live Scanner */}
        <div id="scanner">
          <HeroScanner />
        </div>

        {/* Enterprise Compliance Intelligence & 3-Pillar Architecture Section */}
        <FeaturesGrid />
      </main>

      <Footer />
    </div>
  );
}
