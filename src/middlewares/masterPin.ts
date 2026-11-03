import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { verifyPassword } from '../utils/crypto';
import { audit } from '../services/audit.service';
import { tagAccess } from './access';

/**
 * Secondary authorisation for money- and policy-critical super-admin actions
 * (payout release, commission / GST changes). The PIN comes in the `x-master-pin` header.
 * Must run AFTER requireStaff().
 */
export const requireMasterPin = (): RequestHandler => tagAccess(async (req, _res, next) => {
  if (req.staff?.role !== 'super_admin') throw ApiError.forbidden();
  const pin = req.get('x-master-pin');
  if (!pin) throw ApiError.forbidden('Master PIN required (x-master-pin header)', 'MASTER_PIN_REQUIRED');
  const sa = await prisma.superAdmin.findUnique({ where: { id: req.staff.id }, select: { masterPinHash: true } });
  const valid = sa ? await verifyPassword(pin, sa.masterPinHash) : false;
  if (!valid) {
    await audit({
      actor: { id: req.staff.id, role: 'super_admin' },
      action: 'MASTER_PIN_FAILED',
      targetEntity: 'SuperAdmin',
      targetId: req.staff.id,
      req,
    });
    throw ApiError.forbidden('Invalid master PIN', 'MASTER_PIN_INVALID');
  }
  next();
}, '+ master PIN (x-master-pin)');
