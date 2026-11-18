import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import {
  DEFAULT_ITEM_FILTERS,
  itemFiltersActive,
  type ItemFilters,
  type ItemSort,
} from '../../features/items/filters';
import { styles } from '../../styles/sheets.styles';
import { colors } from '../../styles/theme';
import { PrimaryButton, TextLink } from '../Buttons';

const SORTS: { key: ItemSort; label: string }[] = [
  { key: 'urgent', label: 'Expiring soonest' },
  { key: 'name', label: 'A to Z' },
  { key: 'newest', label: 'Recently added' },
];

interface Props {
  visible: boolean;
  filters: ItemFilters;
  classifications: string[]; // kinds of food the user has, for the chips
  onChange: (filters: ItemFilters) => void;
  onSelectToRemove: () => void; // switches the Pantry into "pick items to remove" mode
  onClose: () => void;
}

// The blue settings button next to the Pantry search box: filters, sorting, and the way
// into "select items to remove".
export function ItemFilterSheet({ visible, filters, classifications, onChange, onSelectToRemove, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Pantry settings</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
            <Pressable
              style={styles.actionRow}
              onPress={() => {
                onClose();
                onSelectToRemove();
              }}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Select items to remove</Text>
                <Text style={styles.actionSub}>Pick items, then choose how many of each</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textPlaceholder} />
            </Pressable>

            <View style={styles.actionRow}>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Needs attention</Text>
                <Text style={styles.actionSub}>Only items that are Urgent or Use soon</Text>
              </View>
              <Switch
                value={filters.attentionOnly}
                onValueChange={(attentionOnly) => onChange({ ...filters, attentionOnly })}
                trackColor={{ true: colors.primary, false: colors.checkboxBorder }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Only show items that need attention"
              />
            </View>

            {classifications.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.section}>Kind of food</Text>
                <View style={styles.chipRow}>
                  {[null, ...classifications].map((label) => {
                    const active = filters.classification === label;
                    return (
                      <Pressable
                        key={label ?? '__all'}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => onChange({ ...filters, classification: label })}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label ?? 'All'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <Text style={styles.section}>Sort by</Text>
              <View style={styles.chipRow}>
                {SORTS.map((s) => {
                  const active = filters.sort === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onChange({ ...filters, sort: s.key })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <PrimaryButton label="Done" onPress={onClose} />
            {itemFiltersActive(filters) ? (
              <TextLink label="Reset" onPress={() => onChange(DEFAULT_ITEM_FILTERS)} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
