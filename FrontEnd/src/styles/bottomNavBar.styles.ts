import { StyleSheet } from 'react-native';
import { colors, layout, radii, shadows, spacing } from './theme';

// "bottom" depends on the device's safe area, so BottomNavBar.tsx sets it inline.
export const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    height: layout.navBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navBackground,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    ...shadows.floating,
  },
  group: { flex: 1, flexDirection: 'row' },
  centerGap: { width: layout.fabSize - 4 }, // room for the + button
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navIconInactiveBackground,
  },
  iconCircleActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.navInactive,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
