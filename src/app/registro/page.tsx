import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Crear cuenta",
  description: "Registrate gratis en Destaco.es y publica o reclama tu empresa.",
  path: "/registro",
  noindex: true,
});

export default function RegistroPage() {
  return (
    <div className="mx-auto flex min-h-[78vh] max-w-md flex-col justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
