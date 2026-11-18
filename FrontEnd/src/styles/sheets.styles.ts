import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './theme';

// Look shared by the bottom sheets on the Pantry and Item Info screens
// (same look as the Meals filter sheet).
export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: -spacing.sm },
  section: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.field,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.onPrimary },
  buttons: { gap: spacing.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  actionSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // remove sheet rows
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  removeName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  removeOf: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  stepper: {
    width: 148,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.field,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: { opacity: 0.4 },
  stepperValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dangerButton: {
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLabel: { fontSize: 16, fontWeight: '700', color: colors.onDanger },
  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
