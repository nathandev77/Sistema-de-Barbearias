import IORedis from 'ioredis';

let redisClient: any = null;
let inMemoryCache: Map<string, { value: any; expiresAt: number }> = new Map();

function getRedisInstance() {
  if (redisClient) return redisClient;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  try {
    redisClient = new IORedis(redisUrl);
    redisClient.on('error', (err: any) => {
      console.error('[REDIS ERROR]', err);
    });
  } catch (e) {
    console.warn('[REDIS] Connection failed, using in‑memory fallback');
    redisClient = null as any;
  }
  return redisClient;
}

export const redis = {
  async get(key: string) {
    const client = getRedisInstance();
    if (client) {
      const val = await client.get(key);
      return val ? JSON.parse(val) : null;
    }
    const entry = inMemoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    inMemoryCache.delete(key);
    return null;
  },
  async set(key: string, value: any, ttlSeconds?: number) {
    const client = getRedisInstance();
    const serialized = JSON.stringify(value);
    if (client) {
      if (ttlSeconds) await client.set(key, serialized, 'EX', ttlSeconds);
      else await client.set(key, serialized);
    } else {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER;
      inMemoryCache.set(key, { value, expiresAt });
    }
  },
  async del(key: string) {
    const client = getRedisInstance();
    if (client) await client.del(key);
    else inMemoryCache.delete(key);
  }
};
