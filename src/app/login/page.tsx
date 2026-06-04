import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Iniciar sesion",
  description: "Accede a tu cuenta de Destaco.es.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[78vh] max-w-md flex-col justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
