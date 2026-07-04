"use client";

import { useEffect, useRef } from "react";

/**
 * Registra impresiones de listado (LISTING_IMPRESSION) para las empresas
 * visibles en una pagina de resultados. Un unico beacon por carga con todos
 * los slugs; el backend incrementa el contador agregado de cada empresa.
 * Estas "apariciones en listados" son la metrica de visibilidad que ven los
 * duenos en su panel (y la que dispara el plan Destacado al ir arriba).
 */
export function ImpressionTracker({ slugs }: { slugs: string[] }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || slugs.length === 0) return;
    sent.current = true;

    const payload = JSON.stringify({
      type: "LISTING_IMPRESSION",
      slugs: slugs.slice(0, 30),
      source: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/metrics",
        new Blob([payload], { type: "application/json" }),
      );
    } else {
      fetch("/api/metrics", {
        method: "POST",
        body: payload,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [slugs]);

  return null;
}
