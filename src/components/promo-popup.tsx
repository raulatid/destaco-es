"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Pop-up promocional con imagen. Coloca la imagen en `public/promo-popup.png`.
 *
 * Solo aparece cuando la imagen existe y carga correctamente, una vez por sesion
 * (el cierre se recuerda en sessionStorage). Cambia POPUP_HREF para el destino
 * del click sobre la imagen.
 */
const POPUP_SRC = "/promo-popup.png";
const POPUP_HREF = "/destacar";
const STORAGE_KEY = "destaco_promo_popup_dismissed";

export function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // sessionStorage no disponible: continuamos igualmente.
    }
    const img = new window.Image();
    img.onload = () => {
      // Pequeña espera para no competir con la carga inicial de la pagina.
      setTimeout(() => setOpen(true), 700);
    };
    img.src = POPUP_SRC;
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignorar.
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Promocion"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div className="relative w-full max-w-lg">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 z-10 grid size-9 place-items-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105"
        >
          <X className="size-5" />
        </button>
        <Link href={POPUP_HREF} onClick={close} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POPUP_SRC}
            alt="Promocion"
            className="h-auto w-full rounded-2xl shadow-2xl"
          />
        </Link>
      </div>
    </div>
  );
}
