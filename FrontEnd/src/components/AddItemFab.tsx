import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/addItemFab.styles';
import { colors, layout, spacing } from '../styles/theme';

interface AddItemFabProps {
  bottomOffset: number; // distance from the bottom of the screen (keeps it above the nav bar)
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAddItem: () => void;
}

// The blue "+" floating action button (FAB) and the "Add an item" popover above it.
// Render it as a direct child of the screen's root view so the absolute positions line up.
export function AddItemFab({
  bottomOffset,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onAddItem,
}: AddItemFabProps) {
  return (
    <>
      {isMenuOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={onCloseMenu}
          accessibilityLabel="Close add menu"
        />
      )}

      {isMenuOpen && (
        <View style={[styles.popover, { bottom: bottomOffset + layout.fabSize + spacing.sm }]}>
          <Pressable
            style={styles.option}
            onPress={() => {
              onCloseMenu();
              onAddItem();
            }}
            accessibilityRole="button"
          >
            <View style={styles.optionIcon}>
              <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Add an item</Text>
              <Text style={styles.optionSubtitle}>Name and expiration date</Text>
            </View>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={onToggleMenu}
        accessibilityRole="button"
        accessibilityLabel="Add item"
        style={[styles.fab, { bottom: bottomOffset }]}
      >
        <Ionicons name="add" size={34} color={colors.onPrimary} />
      </Pressable>
    </>
  );
}
