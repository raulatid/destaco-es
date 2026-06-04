import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Cache-aside: devuelve el valor cacheado o ejecuta `fn` y lo guarda.
 * Si Redis no esta disponible, degrada de forma silenciosa a `fn()`.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    if (redis.status === "wait") await redis.connect();
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    return fn();
  }

  const value = await fn();
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* cache opcional: ignoramos fallos de escritura */
  }
  return value;
}
