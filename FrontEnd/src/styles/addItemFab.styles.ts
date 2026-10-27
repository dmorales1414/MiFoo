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
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.floating,
  },
  popoverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  popoverTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  popoverClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverIntro: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  popoverFootnote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.field,
  },
  optionHighlighted: { backgroundColor: colors.primarySoft },
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
