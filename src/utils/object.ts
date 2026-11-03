export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...obj } as T;
  for (const key of keys) delete copy[key];
  return copy as Omit<T, K>;
}

export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = obj[key];
  return out;
}

/** Removes `undefined` values (Prisma treats undefined as "leave unchanged", which is what we want, but JSON bodies are cleaner). */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
