import type { Model } from 'mongoose';

/** "CodeStorm 2026: AI Edition!" → "codestorm-2026-ai-edition". */
export function slugify(input: string, max = 60): string {
  return (
    input
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/, '') || 'item'
  );
}

/** A slug not used yet in `model`, adding -2, -3, … (or a random tail after a few tries). */
export async function uniqueSlug(model: Model<any>, base: string, field = 'slug'): Promise<string> {
  const root = slugify(base);
  for (let i = 1; i <= 5; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (!(await model.exists({ [field]: candidate }))) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}
