import { isProduceClassification } from '../items/classification';
import type { AddItemDraft } from './AddItemContext';

// These limits mirror the database (backend/sql/schema.sql) and the backend models.
export const MAX_NAME_LENGTH = 200;
export const MAX_CLASSIFICATION_LENGTH = 60;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99; // the database allows more; 99 is a sensible limit for a tap-to-count control

export interface DraftErrors {
  itemName?: string;
  expirationDate?: string;
}

export function validateDraft(draft: AddItemDraft): { valid: boolean; errors: DraftErrors } {
  const errors: DraftErrors = {};
  if (draft.itemName.trim().length === 0) errors.itemName = 'Enter a name for this item.';
  // Database rule: packaged food must have an expiration date. Only Produce may skip it.
  if (!isProduceClassification(draft.classification) && !draft.expirationDate) {
    errors.expirationDate = 'Add an expiration date, or classify it as Produce to skip the date.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
