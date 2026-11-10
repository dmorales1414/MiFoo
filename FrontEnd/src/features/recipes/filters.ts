import type { RecipeSummary } from '../../types/recipe';

export type SortMode = 'best' | 'newest' | 'az';

export interface MealFilters {
  readyOnly: boolean; // every ingredient is in the pantry
  expiringOnly: boolean; // uses food that is about to expire
  sort: SortMode;
}

export const DEFAULT_FILTERS: MealFilters = { readyOnly: false, expiringOnly: false, sort: 'best' };

export function filtersActive(f: MealFilters): boolean {
  return f.readyOnly || f.expiringOnly || f.sort !== 'best';
}

// "best" keeps the server's order (uses expiring food first, then fewest missing ingredients).
export function applyFilters(recipes: RecipeSummary[], search: string, f: MealFilters): RecipeSummary[] {
  const q = search.trim().toLowerCase();
  let list = recipes.filter(
    (r) =>
      (!q || r.title.toLowerCase().includes(q)) &&
      (!f.readyOnly || r.canMakeNow) &&
      (!f.expiringOnly || r.usesExpiringSoon.length > 0),
  );
  if (f.sort === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (f.sort === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  return list;
}
