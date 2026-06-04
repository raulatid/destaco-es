"use client";

import { useEffect } from "react";

/**
 * Registra metricas de la ficha de empresa desde el cliente:
 *  - una visita (PROFILE_VIEW) al montar.
 *  - clics en cualquier elemento con `data-track="<TIPO>"` (web/telefono/...).
 *
 * Usa sendBeacon para que el evento sobreviva a la navegacion (p. ej. al abrir
 * la web de la empresa en otra pestaña). El backend deduplica? No: cada vista
 * cuenta; el ranking usa logaritmos para acotar el efecto de outliers.
 */
export function ProfileTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (type: string) => {
      const payload = JSON.stringify({ slug, type, source: window.location.pathname });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/metrics", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/metrics", {
          method: "POST",
          body: payload,
          headers: { "content-type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    };

    send("PROFILE_VIEW");

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      const type = el?.dataset.track;
      if (type) send(type);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);

  return null;
}
