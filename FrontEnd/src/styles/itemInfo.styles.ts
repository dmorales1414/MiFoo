import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staleBanner: { padding: spacing.md, borderRadius: radii.md, backgroundColor: '#FEF3C7' },
  staleText: { fontSize: 13, color: '#92400E' },
  titleBlock: { gap: spacing.xs },
  title: { fontSize: 30, fontWeight: '800', color: colors.textPrimary },
  stored: { fontSize: 15, color: colors.textSecondary },
  storedStrong: { fontWeight: '700' },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm },

  // the three stats: Classified As | Expiring | Quantity
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  stat: { flex: 1, paddingHorizontal: spacing.md, gap: 4 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  // details card
  card: { backgroundColor: colors.field, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },

  // Let's Cook It!
  cookTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  cookSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cookList: { gap: spacing.md },
  cookEmpty: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  cookEmptyLink: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },

  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  updateButton: { backgroundColor: colors.primary },
  updateLabel: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  removeButton: { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.danger },
  removeLabel: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
