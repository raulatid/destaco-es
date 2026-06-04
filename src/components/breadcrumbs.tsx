import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Migas de pan"
      className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.name}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>
                {item.name}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
