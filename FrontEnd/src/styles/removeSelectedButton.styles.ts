import { StyleSheet } from 'react-native';
import { colors, radii, shadows, spacing } from './theme';

// "bottom" depends on the device's safe area, so RemoveSelectedButton.tsx sets it inline.
export const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onDanger,
  },
});
