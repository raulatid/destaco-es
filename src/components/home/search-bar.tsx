"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("ubicacion", location.trim());
    router.push(`/empresas?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card/80 border-border glass mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border p-2 shadow-xl sm:flex-row sm:items-center sm:rounded-full"
    >
      <div className="flex flex-1 items-center gap-2.5 px-3">
        <Search className="text-muted-foreground size-5 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Que buscas? (marketing, dentista...)"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-border hidden h-7 w-px sm:block" />

      <div className="flex flex-1 items-center gap-2.5 px-3">
        <MapPin className="text-muted-foreground size-5 shrink-0" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Donde? (Madrid, Valencia...)"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="sm:rounded-full"
      >
        <Search className="size-4" />
        Buscar
      </Button>
    </form>
  );
}
