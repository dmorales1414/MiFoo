import { useEffect, useState } from 'react';

import { suggestIngredients } from '../../services/api';
import type { IngredientSuggestion } from '../../types/recipe';

// Suggestions for the "Search to add another ingredient" box. Waits until the user pauses
// typing (300 ms) so it does not call the server on every key press.
export function useIngredientSearch(query: string) {
  const [results, setResults] = useState<IngredientSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await suggestIngredients(q);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setResults([]); // offline: the "Add <typed text>" row still works
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, searching };
}
