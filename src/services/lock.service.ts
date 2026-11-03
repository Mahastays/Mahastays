import { randomToken } from '../utils/crypto';
import { getRedis } from '../lib/redis';
import { ApiError } from '../utils/ApiError';

/**
 * Mutual exclusion around inventory checks ("is a room/slot still free?" + "create the hold").
 *  • With REDIS_URL set: distributed lock (SET NX PX) — safe across many API instances.
 *  • Without Redis: in-process mutex — fine for a single instance / local development.
 * Locks are always short-lived; `ttlMs` protects against crashed holders.
 */

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

const tails = new Map<string, Promise<void>>();

async function withMemoryLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => current);
  tails.set(key, tail);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (tails.get(key) === tail) tails.delete(key);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRedisLock<T>(key: string, ttlMs: number, waitMs: number, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (!redis) return withMemoryLock(key, fn);
  const lockKey = `lock:${key}`;
  const token = randomToken(16);
  const deadline = Date.now() + waitMs;
  for (;;) {
    const acquired = await redis.set(lockKey, token, 'PX', ttlMs, 'NX');
    if (acquired === 'OK') break;
    if (Date.now() > deadline) throw ApiError.conflict('This inventory is being booked by someone else. Please retry.', 'LOCK_TIMEOUT');
    await sleep(40 + Math.floor(Math.random() * 40));
  }
  try {
    return await fn();
  } finally {
    await redis.eval(RELEASE_SCRIPT, 1, lockKey, token).catch(() => undefined);
  }
}

export const lockService = {
  withLock<T>(key: string, fn: () => Promise<T>, opts: { ttlMs?: number; waitMs?: number } = {}): Promise<T> {
    return withRedisLock(key, opts.ttlMs ?? 10_000, opts.waitMs ?? 5_000, fn);
  },

  /** Lock several keys in a stable order (avoids deadlocks). */
  async withLocks<T>(keys: string[], fn: () => Promise<T>, opts: { ttlMs?: number; waitMs?: number } = {}): Promise<T> {
    const ordered = [...new Set(keys)].sort();
    const run = (i: number): Promise<T> => (i >= ordered.length ? fn() : lockService.withLock(ordered[i], () => run(i + 1), opts));
    return run(0);
  },
};
