import type { Request } from 'express';
import type { ActorRole, Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { prisma } from '../lib/prisma';

const SENSITIVE = /password|pin|secret|token|accountnumber|hash/i;

/** Deep-clones to plain JSON and strips secrets so audit rows never leak credentials. */
function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      if (v instanceof Date) return v.toISOString();
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, SENSITIVE.test(k) ? '[redacted]' : walk(val)]),
      );
    }
    return v;
  };
  return JSON.parse(JSON.stringify(walk(value))) as Prisma.InputJsonValue;
}

export interface AuditEntry {
  actor: { id?: string | null; role: ActorRole };
  action: string; // e.g. APPROVE_PROPERTY, RELEASE_PAYOUT, OVERRIDE_REFUND
  targetEntity: string; // Property | Vendor | Booking | Payment | ...
  targetId?: string | null;
  previousState?: unknown;
  newState?: unknown;
  req?: Pick<Request, 'ip' | 'get'>;
}

/** Fire-and-forget safe: audit failures are logged but never break the request. */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor.id ?? undefined,
        actorRole: entry.actor.role,
        action: entry.action,
        targetEntity: entry.targetEntity,
        targetId: entry.targetId ?? undefined,
        previousState: sanitize(entry.previousState),
        newState: sanitize(entry.newState),
        ipAddress: entry.req?.ip,
        userAgent: entry.req?.get('user-agent')?.slice(0, 255),
      },
    });
  } catch (err) {
    logger.error({ err, action: entry.action }, 'failed to write audit log');
  }
}
