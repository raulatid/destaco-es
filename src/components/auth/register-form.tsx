"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  registerUser,
  signInWithGoogle,
  type AuthState,
} from "@/lib/actions/auth";

const INITIAL: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, INITIAL);

  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm">
      <div className="flex justify-center">
        <Logo href={null} />
      </div>
      <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">
        Crea tu cuenta
      </h1>
      <p className="text-muted-foreground mt-1 text-center text-sm">
        Unete a Destaco.es y gestiona tu empresa
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
          name="name"
          type="text"
          required
          placeholder="Nombre completo"
          autoComplete="name"
        />
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
          minLength={8}
          placeholder="Contrasena (min. 8 caracteres)"
          autoComplete="new-password"
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
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-5 text-center text-sm">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="text-foreground font-medium">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
