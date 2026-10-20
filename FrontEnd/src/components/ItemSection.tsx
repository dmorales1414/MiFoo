import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/itemSection.styles';
import { colors } from '../styles/theme';
import type { Item } from '../types/item';
import { ItemRow } from './ItemRow';

interface ItemSectionProps {
  title: string; // "Food Items" or "Produce Items"
  items: Item[];
  isManaging: boolean;
  selectedIds: string[];
  onToggleManage: () => void; // the "Manage" / "Done" chip
  onToggleItem: (id: string) => void;
}

// A gray card with a header ("Food Items" + Manage chip) and a list of ItemRows.
export function ItemSection({
  title,
  items,
  isManaging,
  selectedIds,
  onToggleManage,
  onToggleItem,
}: ItemSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>

        <Pressable
          onPress={onToggleManage}
          accessibilityRole="button"
          accessibilityLabel={isManaging ? `Finish managing ${title}` : `Manage ${title}`}
          style={styles.chip}
        >
          <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.chipLabel}>{isManaging ? 'Done' : 'Manage'}</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here yet</Text>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              selectable={isManaging}
              selected={selectedIds.includes(item.id)}
              onPress={onToggleItem}
            />
          ))
        )}
      </View>
    </View>
  );
}
