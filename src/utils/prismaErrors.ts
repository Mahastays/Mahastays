import { Prisma } from '@prisma/client';

export function isPrismaError(err: unknown, code?: string): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && (code === undefined || err.code === code);
}

export const isUniqueViolation = (err: unknown): boolean => isPrismaError(err, 'P2002');
