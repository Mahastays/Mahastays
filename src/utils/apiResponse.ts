import type { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function ok<T>(res: Response, data: T, meta?: object, status = 200): void {
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, undefined, 201);
}

export function paginated<T>(res: Response, items: T[], meta: PageMeta): void {
  ok(res, items, { ...meta });
}
