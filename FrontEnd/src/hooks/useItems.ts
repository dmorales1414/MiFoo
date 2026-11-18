import { useCallback, useRef, useState } from 'react';

import { sampleItems } from '../data/sampleData';
import { fetchItems, removeItemAmount } from '../services/api';
import { cacheItems } from '../services/itemCache';
import type { Item } from '../types/item';

// Loads the user's items from the backend for the Home screen.
//
// If the backend cannot be reached and nothing was loaded yet, the screen falls back to the
// sample data (so the UI is never empty during development) and `offlineReason` explains why.
// In sample mode, removing items only changes the screen, not the database.
export interface RemoveEntry {
  id: string;
  amount: number; // how many to take off the stored quantity (all of it deletes the item)
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [usingSample, setUsingSample] = useState(false);
  const [loaded, setLoaded] = useState(false); // true once the first load (real or sample) finished
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const hasLoadedRealData = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchItems();
      hasLoadedRealData.current = true;
      cacheItems(data);
      setItems(data);
      setUsingSample(false);
      setLoaded(true);
      setOfflineReason(null);
    } catch (error) {
      setOfflineReason(error instanceof Error ? error.message : 'Could not load items.');
      if (!hasLoadedRealData.current) {
        setItems(sampleItems);
        setUsingSample(true);
        setLoaded(true);
      }
      // Otherwise keep showing the last real list we loaded.
    }
  }, []);

  // Takes the given amounts off the given items (an item with nothing left is deleted).
  // Returns how many entries failed, so the screen can say so.
  const removeAmounts = useCallback(
    async (entries: RemoveEntry[]): Promise<number> => {
      if (usingSample) {
        setItems((current) =>
          current
            .map((item) => {
              const entry = entries.find((e) => e.id === item.id);
              return entry ? { ...item, quantity: item.quantity - entry.amount } : item;
            })
            .filter((item) => item.quantity > 0),
        );
        return 0;
      }
      const results = await Promise.allSettled(entries.map((e) => removeItemAmount(e.id, e.amount)));
      await refresh(); // reload so the list matches the database exactly
      return results.filter((r) => r.status === 'rejected').length;
    },
    [usingSample, refresh],
  );

  return { items, loaded, usingSample, offlineReason, refresh, removeAmounts };
}
