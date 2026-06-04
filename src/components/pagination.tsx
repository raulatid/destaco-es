import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

function pageWindow(current: number, total: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const cellClass =
    "grid h-9 min-w-9 place-items-center rounded-lg border px-3 text-sm font-medium transition-colors";

  return (
    <nav
      aria-label="Paginacion"
      className="mt-12 flex items-center justify-center gap-1.5"
    >
      <Link
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          cellClass,
          page <= 1
            ? "text-muted-foreground pointer-events-none opacity-50"
            : "hover:bg-accent",
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

      {pageWindow(page, totalPages).map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            cellClass,
            p === page
              ? "bg-foreground text-background border-foreground"
              : "hover:bg-accent",
          )}
        >
          {p}
        </Link>
      ))}

      <Link
        href={makeHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          cellClass,
          page >= totalPages
            ? "text-muted-foreground pointer-events-none opacity-50"
            : "hover:bg-accent",
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
