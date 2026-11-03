if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startJobs, stopJobs } from './jobs';
import { prisma } from './lib/prisma';
import { closeRedis } from './lib/redis';

async function main(): Promise<void> {
  await prisma.$connect(); // fail fast if MongoDB is unreachable / not a replica set
  logger.info('database connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Mahastays API listening on :${env.PORT} (env=${env.NODE_ENV}, payments=${env.PAYMENT_GATEWAY}, storage=${env.STORAGE_PROVIDER})`);
  });

  if (env.ENABLE_JOBS) startJobs();

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down gracefully');
    stopJobs();
    const force = setTimeout(() => process.exit(1), 15_000);
    force.unref();
    server.close(async () => {
      await prisma.$disconnect().catch(() => undefined);
      await closeRedis();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandled promise rejection'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaught exception');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
