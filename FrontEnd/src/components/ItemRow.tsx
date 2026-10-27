import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/itemRow.styles';
import { colors, statusColors } from '../styles/theme';
import type { Item } from '../types/item';
import { getItemDisplay } from '../utils/expiry';
import { StatusBadge } from './StatusBadge';

interface ItemRowProps {
  item: Item;
  selectable: boolean; // true while the section is in "Manage" mode
  selected: boolean;
  onPress: (id: string) => void;
}

// One food item: icon (or checkbox in manage mode), name, date line, status badge.
export function ItemRow({ item, selectable, selected, onPress }: ItemRowProps) {
  // Packaged items go by their expiration date. Produce without a date goes by days stored
  // (see getItemDisplay in utils/expiry.ts).
  const { status, subtitle } = getItemDisplay(item);

  const iconName = item.category === 'produce' ? 'leaf-outline' : 'restaurant-outline';

  return (
    <Pressable
      // Rows are only tappable in manage mode; otherwise they are display-only for now.
      disabled={!selectable}
      onPress={() => onPress(item.id)}
      accessibilityRole={selectable ? 'checkbox' : undefined}
      accessibilityState={selectable ? { checked: selected } : undefined}
      style={[styles.row, { borderColor: statusColors[status].border }]}
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
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name={item.expirationDate ? 'calendar-outline' : 'time-outline'} size={14} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <StatusBadge status={status} />
    </Pressable>
  );
}
