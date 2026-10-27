import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.field,
  },
  blue: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
