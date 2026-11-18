import type { Item, ItemCategory } from '../../types/item';

// "Classification" is what kind of food an item is, in the user's own words.
// The one that matters to the app is Produce: fruit and vegetables have no printed
// expiration date, so they are tracked by how long they have been stored instead.

// Quick-pick chips on the add/edit screen. The user can still type anything else.
export const CLASSIFICATION_SUGGESTIONS = [
  'Produce',
  'Dairy',
  'Meat',
  'Seafood',
  'Ice Cream',
  'Frozen Meal',
  'Bread',
  'Grains',
  'Canned',
  'Snacks',
  'Drinks',
  'Condiments',
] as const;

export const UNCLASSIFIED_LABEL = 'Uncategorized';

const PRODUCE_WORDS = new Set(['produce', 'fruit', 'fruits', 'vegetable', 'vegetables', 'veggies']);

export function isProduceClassification(classification: string | null | undefined): boolean {
  return PRODUCE_WORDS.has((classification ?? '').trim().toLowerCase());
}

// Produce is the only category that may skip the expiration date.
export function categoryFor(classification: string | null | undefined): ItemCategory {
  return isProduceClassification(classification) ? 'produce' : 'packaged';
}

// What to show for an item's classification. Older items have none: produce still reads
// "Produce", everything else "Uncategorized".
export function classificationLabel(item: Pick<Item, 'classification' | 'category'>): string {
  const own = item.classification?.trim();
  if (own) return own;
  return item.category === 'produce' ? 'Produce' : UNCLASSIFIED_LABEL;
}
