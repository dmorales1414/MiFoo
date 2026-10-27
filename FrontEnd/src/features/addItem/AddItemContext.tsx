import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ItemCategory } from '../../types/item';
import type { ProductSuggestion } from '../../types/product';

// The item being built while the user moves through the add-item screens.
// It lives in app/add/_layout.tsx, so it is created when the flow opens and thrown away
// when the flow closes. Nothing is sent to the backend until the final "Add item" press.
export interface AddItemDraft {
  product: ProductSuggestion | null; // set when the item was identified by its barcode
  itemName: string;
  category: ItemCategory;
  expirationDate: string | null; // 'YYYY-MM-DD'
  dateSource: 'scan' | 'manual' | null; // where the date came from (shown as a small tag)
  quantity: number;
}

const emptyDraft: AddItemDraft = {
  product: null,
  itemName: '',
  category: 'packaged',
  expirationDate: null,
  dateSource: null,
  quantity: 1,
};

interface AddItemContextValue {
  draft: AddItemDraft;
  update: (patch: Partial<AddItemDraft>) => void;
  startFromProduct: (product: ProductSuggestion) => void;
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
    // Anything with a barcode is packaged food; the user can still change it on the review screen.
    setDraft({ ...emptyDraft, product, itemName: product.itemName, category: 'packaged' });
  }, []);

  const setScannedDate = useCallback((iso: string) => {
    setDraft((current) => ({ ...current, expirationDate: iso, dateSource: 'scan' }));
  }, []);

  const reset = useCallback(() => setDraft(emptyDraft), []);

  const value = useMemo(
    () => ({ draft, update, startFromProduct, setScannedDate, reset }),
    [draft, update, startFromProduct, setScannedDate, reset],
  );

  return <AddItemContext.Provider value={value}>{children}</AddItemContext.Provider>;
}

export function useAddItem(): AddItemContextValue {
  const context = useContext(AddItemContext);
  if (!context) throw new Error('useAddItem must be used inside <AddItemProvider> (app/add/_layout.tsx).');
  return context;
}
