import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="spotlight flex min-h-[72vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground/40 text-7xl font-semibold tracking-tight sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Pagina no encontrada
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-pretty">
        La pagina que buscas no existe o todavia no esta disponible. Vuelve al
        inicio o explora el directorio.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="brand">
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/empresas">Explorar empresas</Link>
        </Button>
      </div>
    </div>
  );
}
