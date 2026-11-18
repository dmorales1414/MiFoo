import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Item, ItemLocation } from '../../types/item';
import type { ProductSuggestion } from '../../types/product';

// The item being built while the user moves through the add-item screens.
// It lives in app/add/_layout.tsx, so it is created when the flow opens and thrown away
// when the flow closes. Nothing is sent to the backend until the final "Add item" press.
export interface AddItemDraft {
  product: ProductSuggestion | null; // set when the item was identified by its barcode
  itemName: string;
  classification: string; // what kind of food ("Ice Cream", "Produce"); "Produce" may skip the date
  location: ItemLocation; // Fridge / Freezer / Pantry
  expirationDate: string | null; // 'YYYY-MM-DD'
  dateSource: 'scan' | 'manual' | null; // where the date came from (shown as a small tag)
  quantity: number;
  editingId: string | null; // set when changing a stored item instead of adding a new one
}

const emptyDraft: AddItemDraft = {
  product: null,
  itemName: '',
  classification: '',
  location: 'pantry',
  expirationDate: null,
  dateSource: null,
  quantity: 1,
  editingId: null,
};

interface AddItemContextValue {
  draft: AddItemDraft;
  update: (patch: Partial<AddItemDraft>) => void;
  startFromProduct: (product: ProductSuggestion) => void;
  startFromItem: (item: Item) => void;
  setScannedDate: (iso: string) => void;
  reset: () => void;
}

const AddItemContext = createContext<AddItemContextValue | null>(null);

export function AddItemProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<AddItemDraft>(emptyDraft);

  const update = useCallback((patch: Partial<AddItemDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const startFromProduct = useCallback((product: ProductSuggestion) => {
    // Anything with a barcode starts as packaged food (no classification, so a date is required);
    // the user can pick a classification and place on the review screen.
    setDraft({ ...emptyDraft, product, itemName: product.itemName });
  }, []);

  // The Update button on Item Info: fill the form with the stored item.
  const startFromItem = useCallback((item: Item) => {
    setDraft({
      ...emptyDraft,
      itemName: item.itemName,
      classification: item.classification ?? (item.category === 'produce' ? 'Produce' : ''),
      location: item.location,
      expirationDate: item.expirationDate,
      dateSource: item.expirationDate ? 'manual' : null,
      quantity: item.quantity,
      editingId: item.id,
    });
  }, []);

  const setScannedDate = useCallback((iso: string) => {
    setDraft((current) => ({ ...current, expirationDate: iso, dateSource: 'scan' }));
  }, []);

  const reset = useCallback(() => setDraft(emptyDraft), []);

  const value = useMemo(
    () => ({ draft, update, startFromProduct, startFromItem, setScannedDate, reset }),
    [draft, update, startFromProduct, startFromItem, setScannedDate, reset],
  );

  return <AddItemContext.Provider value={value}>{children}</AddItemContext.Provider>;
}

export function useAddItem(): AddItemContextValue {
  const context = useContext(AddItemContext);
  if (!context) throw new Error('useAddItem must be used inside <AddItemProvider> (app/add/_layout.tsx).');
  return context;
}
