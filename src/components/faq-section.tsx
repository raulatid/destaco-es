import { cn } from "@/lib/utils";

interface Faq {
  question: string;
  answer: string;
}

/**
 * Seccion de preguntas frecuentes (acordeon nativo con <details>).
 * El JSON-LD FAQPage se inyecta aparte con <JsonLd data={faqJsonLd(faqs)} />.
 */
export function FaqSection({
  faqs,
  title = "Preguntas frecuentes",
  subtitle,
  className,
}: {
  faqs: Faq[];
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  if (faqs.length === 0) return null;
  return (
    <section className={cn("max-w-3xl", className)}>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
      )}
      <div className="mt-5 space-y-2">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group bg-card rounded-xl border p-4 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
              {faq.question}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
