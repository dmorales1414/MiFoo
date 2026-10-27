import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

export const styles = StyleSheet.create({
  // FormField
  field: { gap: spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  tag: { fontSize: 11, color: colors.textSecondary },
  error: { fontSize: 12, color: colors.danger },

  // TextField / DateField (same look)
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.field,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputError: { borderWidth: 1, borderColor: colors.danger },
  inputText: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: spacing.md },
  placeholder: { color: colors.textPlaceholder },

  // QuantityStepper
  stepper: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.field,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: { opacity: 0.4 },
  stepperValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  // CategoryToggle
  toggle: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radii.md,
    backgroundColor: colors.field,
  },
  toggleOption: {
    flex: 1,
    height: 44,
    borderRadius: radii.md - 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleOptionSelected: { backgroundColor: colors.background, borderColor: colors.primary },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleLabelSelected: { color: colors.primary },
});
