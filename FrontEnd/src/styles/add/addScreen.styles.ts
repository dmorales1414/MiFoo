import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

// Layout shared by all five add-item screens, plus the few cards that are specific to one.
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.xl, paddingBottom: spacing.xl },
  sectionPadding: { paddingHorizontal: spacing.xl },
  form: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.xs },
  footnote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs },
  footnoteDanger: { color: colors.danger },

  // Confirm item: product card
  productCard: { borderRadius: radii.xl, backgroundColor: colors.field, padding: spacing.lg, gap: spacing.lg },
  productTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchedChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchedText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  barcodeNumber: { fontSize: 11, color: colors.textSecondary },
  productImageWrap: {
    height: 170,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  productMeta: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  categoryChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },

  // Scan date: detected date card
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.field,
    padding: spacing.lg,
  },
  detectedText: { flex: 1, gap: 2 },
  detectedLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.textSecondary },
  detectedDate: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  detectedDateEmpty: { color: colors.textPlaceholder },
  detectedHint: { fontSize: 12, color: colors.textSecondary },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Review: summary card at the top
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.field,
    padding: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  summaryText: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryMeta: { fontSize: 12, fontWeight: '600', color: colors.success },
  summaryMetaMuted: { fontSize: 12, color: colors.textSecondary },
});
