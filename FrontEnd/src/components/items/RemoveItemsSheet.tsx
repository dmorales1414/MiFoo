import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { RemoveEntry } from '../../hooks/useItems';
import { styles } from '../../styles/sheets.styles';
import { colors } from '../../styles/theme';
import type { Item } from '../../types/item';

interface Props {
  visible: boolean;
  items: Item[]; // the items being removed (one from Item Info, several from the Pantry)
  busy?: boolean;
  onClose: () => void;
  onConfirm: (entries: RemoveEntry[]) => void;
}

// "How many do you want to remove?" One row per item with a − / + stepper that starts at the
// full quantity. Taking everything deletes the item; taking less just lowers its quantity.
export function RemoveItemsSheet({ visible, items, busy = false, onClose, onConfirm }: Props) {
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  // Start every stepper at the item's full quantity each time the sheet opens. The key changes
  // only when the items or their quantities change, not on every re-render of the parent.
  const itemsKey = items.map((item) => `${item.id}:${item.quantity}`).join(',');
  useEffect(() => {
    if (!visible) return;
    setAmounts(Object.fromEntries(items.map((item) => [item.id, item.quantity])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, itemsKey]);

  const amountFor = (item: Item) => Math.min(item.quantity, Math.max(1, amounts[item.id] ?? item.quantity));
  const setAmount = (item: Item, value: number) =>
    setAmounts((current) => ({ ...current, [item.id]: Math.min(item.quantity, Math.max(1, value)) }));

  const totalUnits = items.reduce((sum, item) => sum + amountFor(item), 0);
  const deletesAll = items.length > 0 && items.every((item) => amountFor(item) >= item.quantity);
  const confirmLabel =
    items.length === 1
      ? deletesAll
        ? 'Remove item'
        : `Remove ${totalUnits}`
      : `Remove ${totalUnits} ${totalUnits === 1 ? 'item' : 'items'}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Remove from your kitchen</Text>
            <Pressable onPress={onClose} disabled={busy} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Choose how many to remove. Removing all of an item deletes it.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const amount = amountFor(item);
              return (
                <View key={item.id} style={styles.removeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.removeName} numberOfLines={1}>
                      {item.itemName}
                    </Text>
                    <Text style={styles.removeOf}>
                      {amount} of {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      style={[styles.stepperButton, amount <= 1 && styles.stepperButtonDisabled]}
                      disabled={amount <= 1 || busy}
                      onPress={() => setAmount(item, amount - 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove fewer ${item.itemName}`}
                    >
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{amount}</Text>
                    <Pressable
                      style={[styles.stepperButton, amount >= item.quantity && styles.stepperButtonDisabled]}
                      disabled={amount >= item.quantity || busy}
                      onPress={() => setAmount(item, amount + 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove more ${item.itemName}`}
                    >
                      <Ionicons name="add" size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.buttons}>
            <Pressable
              style={styles.dangerButton}
              disabled={busy || items.length === 0}
              onPress={() => onConfirm(items.map((item) => ({ id: item.id, amount: amountFor(item) })))}
              accessibilityRole="button"
            >
              {busy ? <ActivityIndicator color={colors.onDanger} /> : <Text style={styles.dangerLabel}>{confirmLabel}</Text>}
            </Pressable>
            <Pressable style={styles.cancel} onPress={onClose} disabled={busy} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
