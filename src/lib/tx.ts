import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { isPrismaError } from '../utils/prismaErrors';

/**
 * Runs a batch of Prisma operations atomically (MongoDB transaction).
 * Convention used across the codebase: the FIRST operation is a *guarded* update
 * (`where: { id, status: { in: [...] } }`). If the guard no longer matches (someone else already
 * performed the transition) Prisma throws P2025, the whole batch rolls back and we return `false`.
 * That makes webhooks, retries and background jobs safe to run concurrently / repeatedly.
 */
export async function runGuarded(ops: Prisma.PrismaPromise<unknown>[]): Promise<boolean> {
  try {
    await prisma.$transaction(ops);
    return true;
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return false;
    throw err;
  }
}
