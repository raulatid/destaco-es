/**
 * IndexNow — notificacion instantanea de URLs nuevas/actualizadas a los
 * buscadores que soportan el protocolo (Bing, Yandex, Seznam, Naver...).
 * Es gratuito y no requiere cuenta. Google NO usa IndexNow: para Google la
 * via es el sitemap + Search Console (ver search-console.ts).
 *
 * Requiere una clave (INDEXNOW_KEY) que se publica en una URL del propio sitio
 * (ver src/app/api/indexnow-key/route.ts) para demostrar la propiedad.
 */
import { SITE } from "../constants";

const ENDPOINT = "https://api.indexnow.org/indexnow";

export function indexNowEnabled(): boolean {
  return Boolean(process.env.INDEXNOW_KEY);
}

export function indexNowKey(): string | undefined {
  return process.env.INDEXNOW_KEY;
}

/**
 * Notifica a IndexNow una lista de URLs (maximo 10.000 por peticion).
 * Best-effort: si falla o no hay clave, no lanza — solo devuelve false.
 */
export async function pingIndexNow(urls: string[]): Promise<boolean> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return false;

  const host = new URL(SITE.url).host;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host,
        key,
        // Convencion clasica: el fichero {clave}.txt en la raiz del dominio
        // (rewrite en next.config.ts). El validador de IndexNow es quisquilloso
        // con las keyLocation "raras" tipo /api/....
        keyLocation: `${SITE.url}/${key}.txt`,
        urlList: urls.slice(0, 10_000),
      }),
    });
    return res.ok || res.status === 202;
  } catch {
    return false;
  }
}
