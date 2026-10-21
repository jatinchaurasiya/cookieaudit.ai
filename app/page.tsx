import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroScanner } from "@/components/landing/HeroScanner";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between apple-canvas">
      <Navbar />

      <main className="flex-1 w-full">
        {/* Top Apple Ribbon */}
        <div className="w-full bg-white/70 border-b border-black/[0.06] py-2.5 px-4 text-center text-xs text-[#86868b]">
          <span className="text-[#1d1d1f] font-semibold mr-1.5">New:</span>
          <span>India DPDP Rules 2025 Notice Mandate &amp; Automated Remediation Engine.</span>
          <a href="#scanner" className="text-[#0066cc] hover:underline ml-2 inline-flex items-center gap-0.5 font-medium">
            Audit now <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {/* Hero Section with Live Scanner */}
        <div id="scanner">
          <HeroScanner />
        </div>

        {/* Enterprise Compliance Intelligence & 3-Pillar Architecture Section */}
        <FeaturesGrid />

        {/* Apple Showcase Bottom CTA Section */}
        <section className="py-20 md:py-28 border-t border-black/[0.06] bg-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.08] text-xs font-semibold text-[#0066cc]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Compliance Infrastructure</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1d1d1f] tracking-[-0.03em] leading-tight">
              Ready to verify statutory privacy &amp; <br className="hidden sm:inline" />
              cookie security?
            </h2>

            <p className="text-base text-[#86868b] max-w-xl mx-auto leading-relaxed">
              Join engineering, security, and privacy teams protecting millions of user sessions with automated compliance surveillance.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#scanner"
                className="apple-btn-primary text-sm shadow-md shadow-[#0071e3]/20 flex items-center gap-2"
              >
                <span>Audit Your Website</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/drift"
                className="apple-link text-sm flex items-center gap-1 py-2 px-3 font-medium"
              >
                <span>Explore Weekly Drift Monitor</span>
                <ChevronRight className="w-3.5 h-3.5 chevron" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
