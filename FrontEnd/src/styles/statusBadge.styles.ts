import { StyleSheet } from 'react-native';
import { radii, spacing } from './theme';

// Colors that change per status (green / orange / red) are applied inline in
// StatusBadge.tsx from statusColors, so this file only holds the shared shape.
export const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.pill,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
