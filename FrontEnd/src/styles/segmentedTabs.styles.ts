import { StyleSheet } from 'react-native';
import { colors, radii, spacing, themedStyles } from './theme';

export const styles = themedStyles(() => StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.field,
    borderRadius: radii.pill,
    padding: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabSelected: {
    backgroundColor: colors.background,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  labelSelected: { fontWeight: '700' },
}));
