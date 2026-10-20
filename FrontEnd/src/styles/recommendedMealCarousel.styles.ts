import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from './theme';

// Width and height of each card depend on the screen size, so they are computed
// inside RecommendedMealCarousel.tsx and applied inline. Everything static is here.
export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  list: {
    flexGrow: 0, // keep the horizontal list only as tall as its cards
  },
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden', // clips the image to the rounded corners
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.placeholderImage,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
