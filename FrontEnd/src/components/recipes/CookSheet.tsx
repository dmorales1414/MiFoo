import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { styles } from '../../styles/recipes/meals.styles';
import { colors } from '../../styles/theme';
import type { PantryMatch, Recipe } from '../../types/recipe';
import { PrimaryButton, TextLink } from '../Buttons';

interface Props {
  visible: boolean;
  recipe: Recipe;
  busy: boolean;
  error: string | null;
  onConfirm: (uses: { itemId: string; amount: number }[]) => void;
  onClose: () => void;
}

// "I cooked this": for each stored item that matches an ingredient, choose HOW MANY you used
// (0 up to how many you have). Those amounts are taken off your kitchen; an item that reaches
// 0 disappears, so Home stays accurate.
export function CookSheet({ visible, recipe, busy, error, onConfirm, onClose }: Props) {
  // STEP 1: build the list of rows, one per distinct stored item that matches an ingredient,
  // and the starting amounts: 1 for the best match of each ingredient (the one expiring first),
  // 0 for everything else. Rebuilt only when the recipe changes.
  const { rows, defaults } = useMemo(() => {
    const seen = new Set<string>();
    const rows: { match: PantryMatch; for: string }[] = [];
    const defaults: Record<string, number> = {};
    for (const ing of recipe.ingredients) {
      ing.matches.forEach((m, index) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          rows.push({ match: m, for: ing.name });
          defaults[m.id] = index === 0 ? 1 : 0;
        }
      });
    }
    return { rows, defaults };
  }, [recipe]);

  // STEP 2: the state is a number PER ITEM (item id -> amount used), not one shared value.
  const [amounts, setAmounts] = useState<Record<string, number>>(defaults);

  // Start from the defaults each time the sheet is opened (or the recipe changes).
  useEffect(() => {
    if (visible) setAmounts({ ...defaults });
  }, [visible, defaults]);

  // STEP 3: change ONE item's amount, never going below 0 or above how many you have.
  const change = (match: PantryMatch, delta: number) =>
    setAmounts((current) => {
      const next = Math.min(match.quantity, Math.max(0, (current[match.id] ?? 0) + delta));
      return { ...current, [match.id]: next };
    });

  // STEP 4: what gets sent: only the items with an amount above 0.
  const uses = rows
    .map(({ match }) => ({ itemId: match.id, amount: amounts[match.id] ?? 0 }))
    .filter((u) => u.amount > 0);
  const totalUnits = uses.reduce((sum, u) => sum + u.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: '80%' }]} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>What did you use?</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <Text style={styles.optionSub}>
            Choose how many of each item you used. Items that reach 0 are removed from your kitchen.
          </Text>
          <ScrollView>
            {rows.map(({ match, for: ingredient }) => {
              const amount = amounts[match.id] ?? 0;
              return (
                <View key={match.id} style={[styles.optionRow, amount === 0 && { opacity: 0.6 }]}>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{match.itemName}</Text>
                    <Text style={[styles.optionSub, match.expiringSoon && styles.ingredientSubSoon]}>
                      {match.quantity} left · for {ingredient}
                      {match.expiringSoon ? ' · use soon' : ''}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      style={[styles.stepperButton, amount <= 0 && styles.stepperButtonDisabled]}
                      disabled={amount <= 0}
                      onPress={() => change(match, -1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Use one less ${match.itemName}`}
                    >
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { minWidth: 32, textAlign: 'center' }]}>{amount}</Text>
                    <Pressable
                      style={[styles.stepperButton, amount >= match.quantity && styles.stepperButtonDisabled]}
                      disabled={amount >= match.quantity}
                      onPress={() => change(match, 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Use one more ${match.itemName}`}
                    >
                      <Ionicons name="add" size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {error ? <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text> : null}
          <View style={styles.sheetButtons}>
            <PrimaryButton
              label={uses.length > 0 ? `Use ${totalUnits} item${totalUnits === 1 ? '' : 's'}` : 'Nothing to use'}
              onPress={() => onConfirm(uses)}
              disabled={uses.length === 0}
              loading={busy}
            />
            <TextLink label="Cancel" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}