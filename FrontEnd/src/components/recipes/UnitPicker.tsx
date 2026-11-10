import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text } from 'react-native';

import { UNITS } from '../../features/recipes/units';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors } from '../../styles/theme';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (unit: string | null) => void;
  onClose: () => void;
}

// The "tbsp v" dropdown, shown as a list that slides up from the bottom.
export function UnitPicker({ visible, selected, onSelect, onClose }: Props) {
  // A unit that is not in the list (from an older recipe) is shown too, so it is never lost.
  const options = UNITS.some((u) => u.value === selected) ? UNITS : [...UNITS, { value: selected, label: String(selected) }];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Unit</Text>
          <ScrollView>
            {options.map((u) => {
              const isSelected = u.value === selected;
              return (
                <Pressable
                  key={String(u.value)}
                  style={[styles.unitRow, isSelected && styles.unitRowSelected]}
                  onPress={() => {
                    onSelect(u.value);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.unitRowText}>{u.label}</Text>
                  {isSelected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
