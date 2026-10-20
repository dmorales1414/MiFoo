import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

// Top and bottom padding depend on the device's safe area (notch, gesture bar),
// so HomeScreen.tsx adds those inline.
export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sections: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
});
