import { z } from 'zod';
import type { PageMeta } from './apiResponse';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function skipTake({ page, limit }: PaginationInput): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function pageMeta({ page, limit }: PaginationInput, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Slice an in-memory array (used when a filter cannot be pushed down to MongoDB). */
export function sliceItems<T>(items: T[], p: PaginationInput): { items: T[]; meta: PageMeta } {
  const { skip, take } = skipTake(p);
  return { items: items.slice(skip, skip + take), meta: pageMeta(p, items.length) };
}
