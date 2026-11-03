import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Composes several middlewares into ONE RequestHandler (runs them in order, forwards errors).
 * Keeps route definitions readable and lets TypeScript infer `req`/`res` in inline handlers.
 */
export function chain(...handlers: RequestHandler[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;
    const run = (err?: unknown): void => {
      if (err) return next(err);
      const handler = handlers[index++];
      if (!handler) return next();
      try {
        const result = handler(req, res, run) as unknown;
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          (result as Promise<unknown>).catch(run);
        }
      } catch (e) {
        run(e);
      }
    };
    run();
  };
}
