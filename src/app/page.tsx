import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedCompanies } from "@/components/home/featured-companies";
import { HowItWorks } from "@/components/home/how-it-works";
import { StatsSection } from "@/components/home/stats-section";
import { PopularLocations } from "@/components/home/popular-locations";
import { CtaSection } from "@/components/home/cta-section";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedCompanies />
      <HowItWorks />
      <StatsSection />
      <PopularLocations />
      <CtaSection />
    </>
  );
}
