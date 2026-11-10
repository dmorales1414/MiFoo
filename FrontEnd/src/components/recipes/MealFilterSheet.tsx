import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Switch, Text, View } from 'react-native';

import { DEFAULT_FILTERS, type MealFilters, type SortMode } from '../../features/recipes/filters';
import { styles } from '../../styles/recipes/meals.styles';
import { colors } from '../../styles/theme';
import { PrimaryButton, TextLink } from '../Buttons';

const SORTS: { key: SortMode; label: string }[] = [
  { key: 'best', label: 'Best match' },
  { key: 'newest', label: 'Newest' },
  { key: 'az', label: 'A to Z' },
];

interface Props {
  visible: boolean;
  filters: MealFilters;
  onChange: (filters: MealFilters) => void;
  onClose: () => void;
}

// The settings button next to the search box: filters and sorting for the Meals list.
export function MealFilterSheet({ visible, filters, onChange, onClose }: Props) {
  const toggle = (
    title: string,
    sub: string,
    value: boolean,
    set: (v: boolean) => void,
  ) => (
    <View style={styles.optionRow}>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={set}
        trackColor={{ true: colors.primary, false: colors.checkboxBorder }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter meals</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View>
            <Text style={styles.sheetSection}>Show only</Text>
            {toggle('Ready to cook', 'You have every ingredient', filters.readyOnly, (v) =>
              onChange({ ...filters, readyOnly: v }),
            )}
            {toggle('Uses food that is expiring', 'Helps you waste less', filters.expiringOnly, (v) =>
              onChange({ ...filters, expiringOnly: v }),
            )}
          </View>

          <View style={{ gap: 10 }}>
            <Text style={styles.sheetSection}>Sort by</Text>
            <View style={styles.sortRow}>
              {SORTS.map((s) => {
                const active = filters.sort === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    onPress={() => onChange({ ...filters, sort: s.key })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sheetButtons}>
            <PrimaryButton label="Done" onPress={onClose} />
            <TextLink label="Reset" onPress={() => onChange(DEFAULT_FILTERS)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
