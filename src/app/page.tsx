import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedCompanies } from "@/components/home/featured-companies";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustedByMarquee } from "@/components/home/trusted-by";
import { StatsSection } from "@/components/home/stats-section";
import { Testimonials } from "@/components/home/testimonials";
import { PopularLocations } from "@/components/home/popular-locations";
import { SeoContent } from "@/components/home/seo-content";
import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/constants";
import { faqJsonLd, homeFaqs } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
};

export default function HomePage() {
  const faqs = homeFaqs();
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedCompanies />
      <HowItWorks />
      <TrustedByMarquee />
      <StatsSection />
      <Testimonials />
      <PopularLocations />
      <SeoContent />
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FaqSection
            faqs={faqs}
            title="Preguntas frecuentes"
            subtitle="Todo lo que necesitas saber sobre Destaco."
            className="mx-auto"
          />
        </div>
      </section>
      <JsonLd data={faqJsonLd(faqs)} />
      <CtaSection />
    </>
  );
}
