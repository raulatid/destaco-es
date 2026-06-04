import Link from "next/link";
import type { ReviewStatus } from "@prisma/client";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { listAdminReviews } from "@/lib/data/admin";
import { cn } from "@/lib/utils";
import { approveReview, rejectReview } from "./actions";

const VALID: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED", "SPAM"];

const FILTERS: { value?: ReviewStatus; label: string }[] = [
  { label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
];

const STATUS_META: Record<
  ReviewStatus,
  { label: string; variant: "muted" | "outline" | "success" }
> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  APPROVED: { label: "Aprobada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "muted" },
  SPAM: { label: "Spam", variant: "muted" },
};

export default async function AdminResenasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const status =
    estado && VALID.includes(estado as ReviewStatus)
      ? (estado as ReviewStatus)
      : undefined;
  const reviews = await listAdminReviews(status);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Resenas</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Modera las resenas enviadas por los usuarios.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/resenas?estado=${filter.value}`
                  : "/admin/resenas"
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        {reviews.length === 0 ? (
          <EmptyState
            title="No hay resenas que mostrar"
            description="Las resenas que envien los usuarios apareceran aqui para moderacion."
          />
        ) : (
          reviews.map((review) => {
            const meta = STATUS_META[review.status];
            return (
              <div
                key={review.id}
                className="bg-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/empresa/${review.companySlug}`}
                    className="font-medium hover:underline"
                  >
                    {review.companyName}
                  </Link>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <StarRating value={review.rating} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {review.authorName} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString("es-ES")}
                </p>
                {review.title && (
                  <p className="mt-2 font-medium">{review.title}</p>
                )}
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {review.body}
                </p>
                <div className="mt-3 flex gap-2">
                  {review.status !== "APPROVED" && (
                    <form action={approveReview}>
                      <input type="hidden" name="id" value={review.id} />
                      <Button type="submit" size="sm" variant="brand">
                        Aprobar
                      </Button>
                    </form>
                  )}
                  {review.status !== "REJECTED" && (
                    <form action={rejectReview}>
                      <input type="hidden" name="id" value={review.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Rechazar
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
