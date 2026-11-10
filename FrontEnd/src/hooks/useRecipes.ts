import { useCallback, useState } from 'react';

import { fetchRecipes } from '../services/api';
import type { RecipeSummary } from '../types/recipe';

// Loads the user's meals (best suggestion first). Call refresh() from useFocusEffect so the
// list updates after creating or editing a meal.
export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRecipes(await fetchRecipes());
      setError(null);
    } catch (e) {
      // Keep showing the last list we had, and say why it may be out of date.
      setError(e instanceof Error ? e.message : 'Could not load your meals.');
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }, []);

  return { recipes, loaded, refreshing, error, refresh };
}
