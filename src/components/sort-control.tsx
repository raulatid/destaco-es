"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SORT_OPTIONS, type SortOption } from "@/lib/ranking";

export function SortControl({ value }: { value: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "score") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    // Al cambiar el orden volvemos a la primera pagina.
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Ordenar por</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-card focus-visible:ring-ring rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
