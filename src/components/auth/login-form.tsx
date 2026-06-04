"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser, signInWithGoogle, type AuthState } from "@/lib/actions/auth";

const INITIAL: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginUser, INITIAL);

  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm">
      <div className="flex justify-center">
        <Logo href={null} />
      </div>
      <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">
        Inicia sesion
      </h1>
      <p className="text-muted-foreground mt-1 text-center text-sm">
        Accede a tu cuenta de Destaco.es
      </p>

      <form action={signInWithGoogle} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Continuar con Google
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">o con tu email</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form action={action} className="space-y-3">
        <Input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          required
          placeholder="Contrasena"
          autoComplete="current-password"
        />
        {state.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}
        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Entrando..." : "Iniciar sesion"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-5 text-center text-sm">
        No tienes cuenta?{" "}
        <Link href="/registro" className="text-foreground font-medium">
          Registrate gratis
        </Link>
      </p>
    </div>
  );
}
