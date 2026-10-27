import { useCallback, useRef, useState } from 'react';

import { sampleItems } from '../data/sampleData';
import { deleteItem, fetchItems } from '../services/api';
import type { Item } from '../types/item';

// Loads the user's items from the backend for the Home screen.
//
// If the backend cannot be reached and nothing was loaded yet, the screen falls back to the
// sample data (so the UI is never empty during development) and `offlineReason` explains why.
// In sample mode, removing items only changes the screen, not the database.
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [usingSample, setUsingSample] = useState(false);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const hasLoadedRealData = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchItems();
      hasLoadedRealData.current = true;
      setItems(data);
      setUsingSample(false);
      setOfflineReason(null);
    } catch (error) {
      setOfflineReason(error instanceof Error ? error.message : 'Could not load items.');
      if (!hasLoadedRealData.current) {
        setItems(sampleItems);
        setUsingSample(true);
      }
      // Otherwise keep showing the last real list we loaded.
    }
  }, []);

  const removeItems = useCallback(
    async (ids: string[]) => {
      if (usingSample) {
        setItems((current) => current.filter((item) => !ids.includes(item.id)));
        return;
      }
      // Delete them all, then reload so the list matches the database exactly.
      await Promise.allSettled(ids.map((id) => deleteItem(id)));
      await refresh();
    },
    [usingSample, refresh],
  );

  return { items, offlineReason, refresh, removeItems };
}
