/**
 * Integracion con Google Search Console API (fuente oficial).
 *
 * IMPORTANTE: enviar un sitemap o inspeccionar una URL NO garantiza la
 * indexacion. Google decide si indexa cada pagina segun su calidad y sus
 * propios criterios. Aqui solo enviamos el sitemap y consultamos el estado
 * real que reporta Google — nunca prometemos indexacion inmediata.
 *
 * La Indexing API de Google solo admite paginas de tipo JobPosting y
 * BroadcastEvent, por lo que NO se usa para fichas de empresa.
 *
 * Auth: cuenta de servicio (service account) con acceso a la propiedad de
 * Search Console. Las credenciales viven en variables de entorno y nunca se
 * exponen al frontend.
 */
import { google } from "googleapis";
import { IndexStatus, Prisma } from "@prisma/client";

import { SITE } from "../constants";
import { prisma } from "../prisma";

// Propiedad de Search Console: "sc-domain:destaco.es" o "https://destaco.es/".
const SITE_PROPERTY = process.env.SEARCH_CONSOLE_SITE_URL;

export function searchConsoleEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_SC_CLIENT_EMAIL &&
      process.env.GOOGLE_SC_PRIVATE_KEY &&
      SITE_PROPERTY,
  );
}

function getClient() {
  const clientEmail = process.env.GOOGLE_SC_CLIENT_EMAIL;
  // Las private keys se guardan con \n escapados en el .env.
  const privateKey = process.env.GOOGLE_SC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey || !SITE_PROPERTY) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters"],
  });
  return google.searchconsole({ version: "v1", auth });
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

/** Traduce el estado de cobertura que reporta Google a nuestro enum. */
function mapCoverage(coverageState?: string | null): IndexStatus {
  const state = (coverageState ?? "").toLowerCase();
  if (state.includes("indexed") && !state.includes("not indexed")) {
    return IndexStatus.INDEXED;
  }
  if (state.includes("crawled")) return IndexStatus.CRAWLED;
  if (state.includes("discovered")) return IndexStatus.DISCOVERED;
  if (state.includes("excluded") || state.includes("not indexed")) {
    return IndexStatus.EXCLUDED;
  }
  if (state.includes("unknown") || state === "") return IndexStatus.UNKNOWN;
  return IndexStatus.UNKNOWN;
}

export interface SearchConsoleResult {
  ok: boolean;
  skipped?: boolean;
  status?: IndexStatus;
  error?: string;
}

/**
 * Envia el sitemap a Search Console. Idempotente: reenviar el mismo sitemap
 * no causa problemas. No garantiza el rastreo ni la indexacion.
 */
export async function submitSitemap(
  sitemapUrl = `${SITE.url}/sitemap.xml`,
): Promise<SearchConsoleResult> {
  const client = getClient();
  if (!client || !SITE_PROPERTY) {
    return { ok: false, skipped: true };
  }

  try {
    await client.sitemaps.submit({
      siteUrl: SITE_PROPERTY,
      feedpath: sitemapUrl,
    });
    await prisma.$transaction([
      prisma.searchConsoleLog.create({
        data: { action: "submitSitemap", targetUrl: sitemapUrl },
      }),
      prisma.sitemapLog.create({
        data: {
          sitemapUrl,
          submitted: true,
          status: "submitted",
        },
      }),
    ]);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.searchConsoleLog
      .create({
        data: { action: "submitSitemap", targetUrl: sitemapUrl, error: message },
      })
      .catch(() => undefined);
    return { ok: false, error: message };
  }
}

/**
 * Inspecciona el estado real de indexacion de una URL segun Google.
 * Devuelve el IndexStatus reportado y lo registra. No fuerza la indexacion.
 */
export async function inspectUrl(url: string): Promise<SearchConsoleResult> {
  const client = getClient();
  if (!client || !SITE_PROPERTY) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await client.urlInspection.index.inspect({
      requestBody: {
        siteUrl: SITE_PROPERTY,
        inspectionUrl: url,
        languageCode: "es-ES",
      },
    });
    const result = res.data.inspectionResult?.indexStatusResult;
    const status = mapCoverage(result?.coverageState);

    await prisma.searchConsoleLog.create({
      data: {
        action: "inspectUrl",
        targetUrl: url,
        status,
        response: result ? toJson(result) : undefined,
      },
    });
    return { ok: true, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.searchConsoleLog
      .create({
        data: {
          action: "inspectUrl",
          targetUrl: url,
          status: IndexStatus.ERROR,
          error: message,
        },
      })
      .catch(() => undefined);
    return { ok: false, status: IndexStatus.ERROR, error: message };
  }
}
