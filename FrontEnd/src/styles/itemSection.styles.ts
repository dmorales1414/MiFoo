import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipBackground,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
