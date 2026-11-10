// Shapes the backend sends/accepts for meals (see backend/app/schemas/recipe.py).

// A pantry item that counts as "having" an ingredient.
export interface PantryMatch {
  id: string;
  itemName: string;
  quantity: number;
  expiringSoon: boolean;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  inPantry: boolean;
  matches: PantryMatch[];
}

// One row of the Meals list and card of the Home carousel.
export interface RecipeSummary {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  ingredientCount: number;
  ingredientsOwned: number; // ingredient lines found in the pantry
  canMakeNow: boolean; // every ingredient is in the pantry
  usesExpiringSoon: string[]; // names of pantry items this meal would use up
}

export interface Recipe extends RecipeSummary {
  steps: string[];
  ingredients: RecipeIngredient[];
}

// What the app sends to create or replace a meal.
export interface RecipeInput {
  title: string;
  ingredients: { name: string; quantity: number; unit: string | null }[];
  steps: string[];
}

export interface IngredientSuggestion {
  name: string;
  note: string | null;
  source: 'pantry' | 'common';
  defaultUnit: string | null;
}

export interface CookResult {
  updated: number;
  removed: number;
}
