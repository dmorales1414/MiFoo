import type { Item } from '../types/item';

// The last copy of each item the app received. Item Info shows it the moment you tap an item
// (no waiting, no spinner), then loads the fresh copy from the server in the background.
const cache = new Map<string, Item>();

export function cacheItems(items: Item[]): void {
  for (const item of items) cache.set(item.id, item);
}

export function cacheItem(item: Item): void {
  cache.set(item.id, item);
}

export function getCachedItem(id: string | undefined): Item | null {
  return (id && cache.get(id)) || null;
}

export function forgetItem(id: string): void {
  cache.delete(id);
}

// Log out: the next person must not see this user's items.
export function clearItemCache(): void {
  cache.clear();
}
