import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

let client: Redis | null = null;

/** Returns a shared Redis client, or null when REDIS_URL is not configured. */
export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, enableReadyCheck: true });
    client.on('error', (err) => logger.error({ err }, 'redis error'));
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
