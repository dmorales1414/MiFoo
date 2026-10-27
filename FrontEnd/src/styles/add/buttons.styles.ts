import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

export const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryDisabled: { backgroundColor: colors.primaryDisabled },
  primaryLabel: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkLabel: { fontSize: 14, fontWeight: '600', color: colors.primary },
  // Compact version used inside the camera area for "Allow camera".
  small: { height: 44, paddingHorizontal: spacing.xl },
});
