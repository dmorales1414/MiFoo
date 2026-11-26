import { StyleSheet } from 'react-native';
import { colors, spacing, themedStyles } from '../theme';

export const styles = themedStyles(() => StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.primaryText },
  progress: { flexDirection: 'row', gap: 4 },
  segment: { width: 26, height: 4, borderRadius: 2 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
}));
