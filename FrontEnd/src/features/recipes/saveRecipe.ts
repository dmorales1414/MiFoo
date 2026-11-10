import { createRecipe, removeRecipePhoto, updateRecipe, uploadRecipePhoto } from '../../services/api';
import type { Recipe } from '../../types/recipe';
import type { RecipeForm } from './useRecipeForm';

export interface SaveResult {
  recipe: Recipe;
  // The meal itself was saved but its photo was not (too large, offline...). Not fatal.
  photoError: string | null;
}

// Saves the form: creates the meal (or replaces the existing one), then handles the photo.
// Throws if the meal itself could not be saved.
export async function saveRecipe(form: RecipeForm, existing?: Recipe): Promise<SaveResult> {
  const input = form.toInput();
  if (!input) throw new Error('Please fill in the missing parts first.');

  let recipe = existing ? await updateRecipe(existing.id, input) : await createRecipe(input);

  try {
    if (form.photo.kind === 'new') {
      recipe = await uploadRecipePhoto(recipe.id, form.photo.photo.base64, form.photo.photo.contentType);
    } else if (form.photo.kind === 'none' && recipe.imageUrl) {
      recipe = await removeRecipePhoto(recipe.id);
    }
  } catch (e) {
    return { recipe, photoError: e instanceof Error ? e.message : 'The photo could not be saved.' };
  }
  return { recipe, photoError: null };
}
