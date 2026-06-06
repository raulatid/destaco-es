import Link from "next/link";
import { ArrowUpRight, Award, BadgeCheck, MapPin } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import type { CompanyCardData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const PRICE_LABEL: Record<number, string> = {
  1: "€",
  2: "€€",
  3: "€€€",
  4: "€€€€",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function CompanyCard({
  company,
  className,
}: {
  company: CompanyCardData;
  className?: string;
}) {
  return (
    <Link
      href={`/empresa/${company.slug}`}
      className={cn(
        "group bg-card hover:border-foreground/20 relative flex flex-col rounded-xl border p-5 transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      {company.coverImage && (
        <div className="-mx-5 -mt-5 mb-4 aspect-[16/9] overflow-hidden rounded-t-xl border-b">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={company.coverImage}
            alt={company.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="bg-muted text-foreground grid size-12 shrink-0 place-items-center rounded-lg border text-sm font-semibold">
          {initials(company.name)}
        </div>
        <div className="flex items-center gap-2">
          {company.award && (
            <Badge className="bg-primary text-primary-foreground gap-1 border-transparent">
              <Award className="size-3" />
              Premiada
            </Badge>
          )}
          {company.featured && !company.award && (
            <Badge variant="outline" className="text-muted-foreground">
              Destacada
            </Badge>
          )}
          <ArrowUpRight className="text-muted-foreground size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="font-semibold tracking-tight">{company.name}</h3>
        {company.verified && (
          <BadgeCheck className="text-primary size-4 shrink-0" />
        )}
      </div>

      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="flex items-center gap-1">
          <CategoryIcon name={company.categoryIcon} className="size-3.5" />
          {company.categoryName}
        </span>
        {company.city && (
          <>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {company.city}
            </span>
          </>
        )}
      </div>

      {company.shortDescription && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
          {company.shortDescription}
        </p>
      )}

      {company.services.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {company.services.slice(0, 3).map((service) => (
            <Badge key={service} variant="muted" className="font-normal">
              {service}
            </Badge>
          ))}
        </div>
      )}

      {(company.reviewCount > 0 || company.priceRange) && (
        <div className="mt-4 flex items-center justify-between border-t pt-3.5">
          {company.reviewCount > 0 ? (
            <StarRating
              value={company.rating}
              reviewCount={company.reviewCount}
            />
          ) : (
            <span />
          )}
          {company.priceRange && (
            <span className="text-muted-foreground text-sm font-medium">
              {PRICE_LABEL[company.priceRange]}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
