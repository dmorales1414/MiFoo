import type { Item } from '../../types/item';
import { getItemDisplay, sortByUrgency } from '../../utils/expiry';
import { classificationLabel } from './classification';
import type { LocationFilter } from './locations';

export type ItemSort = 'urgent' | 'name' | 'newest';

export interface ItemFilters {
  attentionOnly: boolean; // only items that are Urgent or Use soon
  classification: string | null; // only this kind of food (null = all)
  sort: ItemSort;
}

export const DEFAULT_ITEM_FILTERS: ItemFilters = { attentionOnly: false, classification: null, sort: 'urgent' };

export function itemFiltersActive(f: ItemFilters): boolean {
  return f.attentionOnly || f.classification !== null || f.sort !== 'urgent';
}

// The kinds of food the user actually has, for the filter chips (A to Z, no repeats).
export function classificationsIn(items: Item[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const label = classificationLabel(item);
    if (!seen.has(label.toLowerCase())) seen.set(label.toLowerCase(), label);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function applyItemFilters(
  items: Item[],
  location: LocationFilter,
  search: string,
  f: ItemFilters,
  today: Date = new Date(),
): Item[] {
  const q = search.trim().toLowerCase();
  const list = items.filter((item) => {
    if (location !== 'all' && item.location !== location) return false;
    const label = classificationLabel(item);
    if (q && !item.itemName.toLowerCase().includes(q) && !label.toLowerCase().includes(q)) return false;
    if (f.classification && label.toLowerCase() !== f.classification.toLowerCase()) return false;
    if (f.attentionOnly) {
      const { status } = getItemDisplay(item, today);
      if (status !== 'urgent' && status !== 'useSoon') return false;
    }
    return true;
  });
  if (f.sort === 'name') return [...list].sort((a, b) => a.itemName.localeCompare(b.itemName));
  if (f.sort === 'newest') return [...list].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  return sortByUrgency(list, today);
}
