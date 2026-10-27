import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { createItem } from '../../services/api';
import { useAddItem } from './AddItemContext';
import { validateDraft } from './validation';

// Shared by the Review and Manual screens: validate, send POST /items, return to Home.
export function useSubmitItem() {
  const { draft } = useAddItem();
  const [submitting, setSubmitting] = useState(false);
  const { valid, errors } = validateDraft(draft);

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await createItem({
        itemName: draft.itemName.trim(),
        category: draft.category,
        expirationDate: draft.expirationDate,
        quantity: draft.quantity,
      });
      // Close the whole add-item flow. Home reloads its list when it regains focus.
      router.dismissTo('/');
    } catch (error) {
      Alert.alert("Couldn't save the item", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, valid, errors };
}
