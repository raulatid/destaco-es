"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Banner de imagen (1000 x 200 px) en la parte superior del sitio, encima del
 * header. Sustituye al antiguo banner de texto de Selspy.
 *
 * Coloca la imagen en `public/promo-banner.png` (1000 x 200 px). El banner solo
 * se renderiza cuando la imagen existe y carga correctamente, asi que no se ve
 * ningun hueco roto mientras no este el archivo. Cambia BANNER_HREF para el
 * destino del click.
 */
const BANNER_SRC = "/promo-banner.png";
const BANNER_HREF = "/destacar";

export function TopImageBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setReady(true);
    img.src = BANNER_SRC;
  }, []);

  if (!ready) return null;

  return (
    <div className="flex w-full justify-center px-4 py-2">
      <Link
        href={BANNER_HREF}
        aria-label="Promocion"
        className="block w-full max-w-[1000px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_SRC}
          alt="Promocion"
          width={1000}
          height={200}
          className="h-auto w-full rounded-lg"
        />
      </Link>
    </div>
  );
}
