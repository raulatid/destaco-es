"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";
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
      <span className="text-muted-foreground shrink-0">Ordenar por</span>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-auto py-1.5"
      >
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
    </label>
  );
}
