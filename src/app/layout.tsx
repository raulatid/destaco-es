import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/json-ld";
import { auth } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "directorio empresas",
    "empresas Espana",
    "directorio empresarial",
    "buscar empresas",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image", site: SITE.twitter },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#15141c" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, role: session.user.role }
    : null;

  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader user={user} />
          <main className="min-h-dvh">{children}</main>
          <SiteFooter />
        </ThemeProvider>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
