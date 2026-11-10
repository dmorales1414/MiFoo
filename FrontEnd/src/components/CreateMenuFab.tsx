import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/createMenuFab.styles';
import { colors, layout, spacing } from '../styles/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// The blue "+" button in the middle of the navigation bar, and the menu that opens above it:
//   step "main":  Add a Food  /  Add a Meal
//   step "food":  (after "Add a Food")  Scan barcode  /  Enter manually
// "Add a Meal" goes straight to the Create recipe screen.
// Render it as a direct child of the screen's root view (BottomNavBar does this for you).
export function CreateMenuFab({ bottomOffset }: { bottomOffset: number }) {
  const [step, setStep] = useState<'closed' | 'main' | 'food'>('closed');
  const close = () => setStep('closed');

  // The button overlaps the top edge of the nav bar by a little.
  const fabBottom = bottomOffset + layout.navBarHeight - layout.fabSize / 2 + 10;
  const popoverBottom = fabBottom + layout.fabSize + spacing.sm;

  const go = (path: '/add/scan-barcode' | '/add/manual' | '/recipe/new') => {
    close();
    router.push(path);
  };

  const option = (icon: IconName, title: string, subtitle: string, onPress: () => void, highlighted = false) => (
    <Pressable
      style={[styles.option, highlighted && styles.optionHighlighted]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
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

  const closeButton = (
    <Pressable style={styles.roundButton} onPress={close} accessibilityRole="button" accessibilityLabel="Close">
      <Ionicons name="close" size={18} color={colors.textPrimary} />
    </Pressable>
  );

  return (
    <>
      {step !== 'closed' && <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu" />}

      {step === 'main' && (
        <View style={[styles.popoverRow, { bottom: popoverBottom }]} pointerEvents="box-none">
          <View style={styles.popover}>
            {option('nutrition-outline', 'Add a Food', 'Barcode or manual entry', () => setStep('food'))}
            {option('restaurant-outline', 'Add a Meal', 'Create a recipe', () => go('/recipe/new'))}
          </View>
        </View>
      )}

      {step === 'food' && (
        <View style={[styles.popoverRow, { bottom: popoverBottom }]} pointerEvents="box-none">
          <View style={styles.popover}>
            <View style={styles.header}>
              <Pressable
                style={styles.roundButton}
                onPress={() => setStep('main')}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle}>Add an item</Text>
              {closeButton}
            </View>
            <Text style={styles.intro}>Keep track of what's fresh.{'\n'}How would you like to add your item?</Text>
            {option('scan-outline', 'Scan barcode', 'Find packaged food quickly', () => go('/add/scan-barcode'), true)}
            {option('create-outline', 'Enter manually', 'Add any food or produce', () => go('/add/manual'))}
            <Text style={styles.footnote}>You can review everything before adding.</Text>
          </View>
        </View>
      )}

      <Pressable
        onPress={() => setStep((s) => (s === 'closed' ? 'main' : 'closed'))}
        accessibilityRole="button"
        accessibilityLabel={step === 'closed' ? 'Open create menu' : 'Close create menu'}
        style={[styles.fab, { bottom: fabBottom }]}
      >
        <Ionicons name={step === 'closed' ? 'add' : 'close'} size={34} color={colors.onPrimary} />
      </Pressable>
    </>
  );
}
