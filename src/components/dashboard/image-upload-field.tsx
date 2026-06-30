"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const MAX_DIM = 1280; // lado mayor máximo en px
const TARGET_BYTES = 520_000; // objetivo del data URL (~0,5 MB)
const MIN_QUALITY = 0.4;

/**
 * Lee un archivo de imagen, lo redimensiona y comprime en el navegador y
 * devuelve un data URL JPEG por debajo de ~0,5 MB. Así la foto se puede guardar
 * directamente en la base de datos (campo coverImage) sin almacenamiento externo.
 */
/** Carga el archivo en un <img> (compatible con todos los navegadores). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const longest = Math.max(width, height);
  if (longest > MAX_DIM) {
    const scale = MAX_DIM / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  // Fondo blanco por si la imagen original es PNG con transparencia.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

interface ImageUploadFieldProps {
  name?: string;
  initialValue?: string;
  label?: string;
}

/** Campo de subida de foto: elige un archivo del ordenador, lo optimiza y lo
 *  envía con el formulario en un input oculto (data URL). */
export function ImageUploadField({
  name = "coverImage",
  initialValue = "",
  label = "Foto de portada",
}: ImageUploadFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen (JPG o PNG).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      setValue(await fileToCompressedDataUrl(file));
    } catch {
      setError("No se pudo procesar la imagen. Prueba con otra.");
    } finally {
      setBusy(false);
      // Permite volver a elegir el mismo archivo si hiciera falta.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value} />

      {value ? (
        <div className="flex items-center gap-4">
          <div className="bg-muted size-24 shrink-0 overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Vista previa"
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {busy ? "Procesando..." : "Cambiar foto"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue("")}
              disabled={busy}
            >
              <X className="size-4" />
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="border-border hover:bg-accent flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm transition-colors disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          ) : (
            <ImagePlus className="text-muted-foreground size-6" />
          )}
          <span className="font-medium">
            {busy ? "Procesando..." : "Subir foto desde tu ordenador"}
          </span>
          <span className="text-muted-foreground text-xs">
            JPG o PNG · se optimiza automáticamente
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {error && <p className="text-destructive mt-1.5 text-sm">{error}</p>}
    </div>
  );
}
