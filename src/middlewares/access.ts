/**
 * Guards carry a human-readable "who may call this" label on the handler function itself. It has no effect at
 * runtime; scripts/generate-docs.ts reads it to produce an endpoint reference that always matches the code.
 */
const ACCESS = Symbol.for('mahastays.access');

export function tagAccess<T extends object>(handler: T, access: string): T {
  Object.defineProperty(handler, ACCESS, { value: access, enumerable: false });
  return handler;
}

export const readAccess = (handler: unknown): string | undefined => (handler as Record<symbol, string | undefined> | undefined)?.[ACCESS];
