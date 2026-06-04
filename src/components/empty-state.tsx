import { SearchX, type LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-xl border">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
          {description}
        </p>
      )}
    </div>
  );
}
