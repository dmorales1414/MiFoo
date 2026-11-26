'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { LOCATION_LABELS } from '../features/items/locations';
import { styles } from '../styles/itemRow.styles';
import { colors, statusColors } from '../styles/theme';
import type { Item } from '../types/item';
import { getItemDisplay } from '../utils/expiry';
import { StatusBadge } from './StatusBadge';

interface ItemRowProps {
  item: Item;
  onPress: (item: Item) => void; // open Item Info, or tick the box while selecting
  selectable?: boolean; // true while the Pantry is in "select items to remove" mode
  selected?: boolean;
}

// One stored item as a card: icon (or checkbox when selecting), name, how long is left,
// a status badge, and where it is kept. The border color follows the status.
export function ItemRow({ item, onPress, selectable = false, selected = false }: ItemRowProps) {
  // Packaged items go by their expiration date. Produce without a date goes by days stored
  // (see getItemDisplay in utils/expiry.ts).
  const { status, subtitle } = getItemDisplay(item);
  const palette = statusColors[status];
  const iconName = item.category === 'produce' ? 'leaf-outline' : 'restaurant-outline';
  // Red/amber/green text for items with a status; gray for fresh produce.
  const metaColor = palette.metaText;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      accessibilityLabel={`${item.itemName}, ${subtitle}, ${LOCATION_LABELS[item.location]}`}
      style={[styles.row, { borderColor: palette.border, backgroundColor: palette.rowBackground }]}
    >
      {selectable ? (
        <View style={[styles.checkbox, selected ? styles.checkboxChecked : styles.checkboxUnchecked]}>
          {selected && <Ionicons name="checkmark" size={20} color={colors.onPrimary} />}
        </View>
      ) : (
        <View style={styles.leading}>
          <Ionicons name={iconName} size={24} color={colors.textPrimary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.itemName}
          {item.quantity > 1 ? <Text style={styles.quantity}>{`  ×${item.quantity}`}</Text> : null}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons
            name={item.expirationDate ? 'calendar-outline' : 'time-outline'}
            size={14}
            color={metaColor}
          />
          <Text style={[styles.metaText, { color: metaColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.trailing}>
        {status !== 'none' ? <StatusBadge status={status} /> : null}
        <Text style={styles.location}>{LOCATION_LABELS[item.location]}</Text>
      </View>
    </Pressable>
  );
}
