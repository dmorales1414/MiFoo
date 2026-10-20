import { Pressable, Text } from 'react-native';

import { styles } from '../styles/removeSelectedButton.styles';

interface RemoveSelectedButtonProps {
  bottomOffset: number;
  count: number; // how many items are currently checked
  onPress: () => void;
}

// The red "Remove 2 selected items" bar that replaces the + button in manage mode.
export function RemoveSelectedButton({ bottomOffset, count, onPress }: RemoveSelectedButtonProps) {
  const hasSelection = count > 0;
  const label = hasSelection
    ? `Remove ${count} selected ${count === 1 ? 'item' : 'items'}`
    : 'Select items to remove';

  return (
    <Pressable
      onPress={onPress}
      disabled={!hasSelection}
      accessibilityRole="button"
      accessibilityState={{ disabled: !hasSelection }}
      style={[styles.button, { bottom: bottomOffset }, !hasSelection && styles.disabled]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
