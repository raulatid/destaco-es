"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import type { CompanyFormState } from "@/app/dashboard/empresas/actions";
import type { EditableCompany } from "@/lib/data/dashboard";
import { cn, COMPANY_SIZE_LABEL, COMPANY_SIZES } from "@/lib/utils";

interface Option {
  slug: string;
  name: string;
}

interface CompanyFormProps {
  categories: Option[];
  provinces: Option[];
  action: (
    state: CompanyFormState,
    formData: FormData,
  ) => Promise<CompanyFormState>;
  initial?: EditableCompany;
  submitLabel: string;
}

const INITIAL: CompanyFormState = {};

const CURRENT_YEAR = new Date().getFullYear();

const controlClass =
  "flex h-10 w-full rounded-lg border bg-background px-3.5 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function CompanyForm({
  categories,
  provinces,
  action,
  initial,
  submitLabel,
}: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Nombre de la empresa *">
        <Input
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="Mi Empresa S.L."
        />
      </Field>

      <Field label="Categoria *">
        <select
          name="categorySlug"
          required
          defaultValue={initial?.categorySlug ?? ""}
          className={controlClass}
        >
          <option value="" disabled>
            Selecciona una categoria
          </option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descripcion breve">
        <Input
          name="shortDescription"
          defaultValue={initial?.shortDescription}
          placeholder="Una frase que resuma tu empresa"
        />
      </Field>

      <Field label="Descripcion">
        <textarea
          name="description"
          rows={5}
          defaultValue={initial?.description}
          placeholder="Describe tu empresa, tus servicios y tu propuesta de valor."
          className={cn(controlClass, "h-auto py-2.5 leading-relaxed")}
        />
      </Field>

      <ImageUploadField initialValue={initial?.coverImage} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ano de fundacion">
          <Input
            name="founded"
            type="number"
            inputMode="numeric"
            min={1800}
            max={CURRENT_YEAR}
            defaultValue={initial?.founded}
            placeholder="2015"
          />
        </Field>
        <Field label="Tamano de la plantilla (trabajadores)">
          <select
            name="size"
            defaultValue={initial?.size ?? ""}
            className={controlClass}
          >
            <option value="">Sin especificar</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {COMPANY_SIZE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Precio desde (€)">
        <Input
          name="priceFrom"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={initial?.priceFrom}
          placeholder="Ej. 300"
        />
        <span className="text-muted-foreground mt-1 block text-xs">
          Precio a partir del cual empiezan tus servicios. Se mostrara como
          «Desde 300 €» en tu ficha.
        </span>
      </Field>

      <Field label="Servicios que ofreces">
        <textarea
          name="services"
          rows={5}
          defaultValue={initial?.services}
          placeholder={"Un servicio por linea. Por ejemplo:\nDiseño web\nSEO\nCampañas de Google Ads"}
          className={cn(controlClass, "h-auto py-2.5 leading-relaxed")}
        />
        <span className="text-muted-foreground mt-1 block text-xs">
          Escribe un servicio por linea.
        </span>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Web">
          <Input
            name="website"
            type="url"
            defaultValue={initial?.website}
            placeholder="https://..."
          />
        </Field>
        <Field label="Telefono">
          <Input
            name="phone"
            defaultValue={initial?.phone}
            placeholder="600 000 000"
          />
        </Field>
        <Field label="Email">
          <Input
            name="email"
            type="email"
            defaultValue={initial?.email}
            placeholder="hola@miempresa.es"
          />
        </Field>
        <Field label="Codigo postal">
          <Input
            name="postalCode"
            defaultValue={initial?.postalCode}
            placeholder="28001"
          />
        </Field>
      </div>

      <Field label="Direccion">
        <Input
          name="addressLine"
          defaultValue={initial?.addressLine}
          placeholder="Calle y numero"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Provincia">
          <select
            name="provinceSlug"
            defaultValue={initial?.provinceSlug ?? ""}
            className={controlClass}
          >
            <option value="">Sin especificar</option>
            {provinces.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ciudad">
          <Input
            name="cityName"
            defaultValue={initial?.cityName}
            placeholder="Madrid"
          />
        </Field>
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
