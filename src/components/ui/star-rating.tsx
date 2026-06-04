import { Star } from "lucide-react";

import { cn, formatRating } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  value,
  reviewCount,
  size = "sm",
  className,
}: StarRatingProps) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              iconSize,
              i < Math.round(value)
                ? "fill-warning text-warning"
                : "fill-muted text-muted",
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium tabular-nums">
        {formatRating(value)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-muted-foreground text-sm">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
