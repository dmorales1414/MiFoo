import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './theme';

// The border color depends on the item's status, so ItemRow.tsx applies it inline.
export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.rowBackground,
    borderWidth: 2,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  leading: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxUnchecked: {
    backgroundColor: colors.rowBackground,
    borderColor: colors.checkboxBorder,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
