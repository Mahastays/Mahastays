import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getRedis } from '../../lib/redis';
import { ok } from '../../utils/apiResponse';

export const healthRouter = Router();

/** Liveness: the process is up (no dependencies touched — safe for frequent probes). */
healthRouter.get('/', (_req, res) => {
  ok(res, { status: 'ok', uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});

/** Readiness: can we actually serve traffic? Checks MongoDB (and Redis when configured). */
healthRouter.get('/ready', async (_req, res) => {
  const checks: Record<string, 'up' | 'down' | 'not_configured'> = { database: 'down', redis: 'not_configured' };
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    checks.database = 'up';
  } catch {
    checks.database = 'down';
  }
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'up';
    } catch {
      checks.redis = 'down';
    }
  }
  const healthy = checks.database === 'up' && checks.redis !== 'down';
  res.status(healthy ? 200 : 503).json({ success: healthy, data: { status: healthy ? 'ready' : 'degraded', checks } });
});
