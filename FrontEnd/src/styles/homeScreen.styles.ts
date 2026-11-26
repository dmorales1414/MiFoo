import { StyleSheet } from 'react-native';
import { colors, radii, spacing, themedStyles } from './theme';

// Top and bottom padding depend on the device's safe area (notch, gesture bar),
// so HomeScreen.tsx adds those inline.
export const styles = themedStyles(() => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  offlineBanner: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
  },
  offlineText: { fontSize: 12, lineHeight: 17, color: colors.warningSoftText },
  tabsWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  list: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  emptyBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  seeAll: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  seeAllText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
}));
