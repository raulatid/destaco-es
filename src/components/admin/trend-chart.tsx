import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { TrendPoint } from "@/lib/data/admin";
import { cn, formatCompact } from "@/lib/utils";

/**
 * Mini-grafica de area + linea, sin dependencias (SVG puro). Pensada para
 * seguimiento visual de una metrica acumulada a lo largo de los ultimos meses.
 * Usa `preserveAspectRatio="none"` para ocupar todo el ancho y
 * `vector-effect="non-scaling-stroke"` para que el trazo no se deforme.
 */
function Sparkline({
  data,
  className,
}: {
  data: TrendPoint[];
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground/60 text-xs", className)}>
        Sin datos todavia
      </div>
    );
  }

  const W = 100;
  const H = 36;
  const PAD = 3;
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const n = data.length;

  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);

  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  const area = `${line} L ${x(n - 1).toFixed(2)} ${H} L ${x(0).toFixed(2)} ${H} Z`;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-12 w-full"
        role="img"
        aria-label={`Evolucion mensual, valor actual ${values[n - 1]}`}
      >
        <path d={area} className="fill-primary/10" />
        <path
          d={line}
          fill="none"
          className="stroke-primary"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="text-muted-foreground/70 mt-1 flex justify-between text-[10px]">
        <span>{data[0].label}</span>
        <span>{data[n - 1].label}</span>
      </div>
    </div>
  );
}

/** Tarjeta KPI con valor grande + mini-grafica de seguimiento. */
export function TrendCard({
  label,
  value,
  sub,
  data,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  data: TrendPoint[];
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm">{label}</p>
        {href && <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {formatCompact(value)}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      <Sparkline data={data} className="mt-4" />
    </>
  );

  return href ? (
    <Link
      href={href}
      className="bg-card hover:border-foreground/20 rounded-xl border p-5 transition-all hover:shadow-md"
    >
      {inner}
    </Link>
  ) : (
    <div className="bg-card rounded-xl border p-5">{inner}</div>
  );
}
