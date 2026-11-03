import { randomToken } from './crypto';

export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || 'item';
}

/** Appends a short random suffix until `exists` says the slug is free. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  for (let i = 0; i < 5; i += 1) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${root}-${randomToken(2)}`;
  }
  return `${root}-${randomToken(6)}`;
}

export const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);
