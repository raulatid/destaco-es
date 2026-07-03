"use client";

import { useState } from "react";

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** Que renderizar si la imagen no carga (por defecto, nada). */
  fallback?: React.ReactNode;
}

/**
 * Imagen de portada resiliente: si la URL falla (p. ej. una photoUri de Google
 * caducada), en vez del icono de imagen rota renderiza el `fallback` (o nada).
 */
export function CoverImage({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
  fallback = null,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    </div>
  );
}
