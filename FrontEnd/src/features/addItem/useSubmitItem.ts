import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { createItem, updateItem } from '../../services/api';
import { categoryFor } from '../items/classification';
import { useAddItem } from './AddItemContext';
import { validateDraft } from './validation';

// Shared by the Review and Manual screens: validate, then send POST /items (new item) or
// PATCH /items/{id} (when the Update button was used), and go back.
export function useSubmitItem() {
  const { draft } = useAddItem();
  const [submitting, setSubmitting] = useState(false);
  const { valid, errors } = validateDraft(draft);

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const classification = draft.classification.trim() || null;
      const fields = {
        itemName: draft.itemName.trim(),
        category: categoryFor(classification),
        expirationDate: draft.expirationDate,
        quantity: draft.quantity,
        location: draft.location,
        classification,
      };
      if (draft.editingId) {
        await updateItem(draft.editingId, fields);
        // Back to that item's page (it reloads when it regains focus).
        router.dismissTo({ pathname: '/item/[id]', params: { id: draft.editingId } });
      } else {
        await createItem(fields);
        // Close the whole add-item flow. Home reloads its list when it regains focus.
        router.dismissTo('/');
      }
    } catch (error) {
      Alert.alert("Couldn't save the item", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, valid, errors };
}
