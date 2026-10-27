import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/addItemFab.styles';
import { colors, layout, spacing } from '../styles/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AddItemFabProps {
  bottomOffset: number; // distance from the bottom of the screen (keeps it above the nav bar)
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onScanBarcode: () => void;
  onEnterManually: () => void;
}

// The blue "+" floating action button (FAB) and the "Add an item" card that opens above it
// with two ways to add: scan a barcode, or type it in.
// Render it as a direct child of the screen's root view so the absolute positions line up.
export function AddItemFab({
  bottomOffset,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onScanBarcode,
  onEnterManually,
}: AddItemFabProps) {
  const renderOption = (icon: IconName, title: string, subtitle: string, onPress: () => void, highlighted = false) => (
    <Pressable
      style={[styles.option, highlighted && styles.optionHighlighted]}
      onPress={() => {
        onCloseMenu();
        onPress();
      }}
      accessibilityRole="button"
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <>
      {isMenuOpen && (
        <Pressable style={styles.backdrop} onPress={onCloseMenu} accessibilityLabel="Close add menu" />
      )}

      {isMenuOpen && (
        <View style={[styles.popover, { bottom: bottomOffset + layout.fabSize + spacing.sm }]}>
          <View style={styles.popoverHeader}>
            <Text style={styles.popoverTitle}>Add an item</Text>
            <Pressable
              style={styles.popoverClose}
              onPress={onCloseMenu}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          <Text style={styles.popoverIntro}>
            Keep track of what's fresh.{'\n'}How would you like to add your item?
          </Text>

          {renderOption('scan-outline', 'Scan barcode', 'Find packaged food quickly', onScanBarcode, true)}
          {renderOption('create-outline', 'Enter manually', 'Add any food or produce', onEnterManually)}

          <Text style={styles.popoverFootnote}>You can review everything before adding.</Text>
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
