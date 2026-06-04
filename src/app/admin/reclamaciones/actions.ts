"use server";

import { resolveClaim } from "@/lib/actions/claims";

export async function approveClaim(formData: FormData) {
  const id = formData.get("id");
  if (typeof id === "string") await resolveClaim(id, "approve");
}

export async function rejectClaim(formData: FormData) {
  const id = formData.get("id");
  const reason = formData.get("reason");
  if (typeof id === "string") {
    await resolveClaim(id, "reject", typeof reason === "string" ? reason : undefined);
  }
}
