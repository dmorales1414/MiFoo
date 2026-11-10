import { StyleSheet } from 'react-native';
import { colors, layout, radii, shadows, spacing } from './theme';

// Positions depend on the device's safe area, so CreateMenuFab.tsx sets "bottom" inline.
export const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject, // invisible layer: tapping it closes the menu
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -layout.fabSize / 2,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.floating,
  },
  popoverRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  popover: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.floating,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  roundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, paddingHorizontal: spacing.xs },
  footnote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.field,
  },
  optionHighlighted: { backgroundColor: colors.primarySoft },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.popoverIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  optionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
