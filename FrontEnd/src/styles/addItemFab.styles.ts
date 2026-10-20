import { StyleSheet } from 'react-native';
import { colors, layout, radii, shadows, spacing } from './theme';

// "bottom" depends on the device's safe area, so AddItemFab.tsx sets it inline.
export const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject, // invisible layer: tapping it closes the menu
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  popover: {
    position: 'absolute',
    right: spacing.xl,
    width: 270,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.sm,
    ...shadows.floating,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#F3F4F6',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.popoverIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
