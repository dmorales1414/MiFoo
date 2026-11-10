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
  cardCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardNote: { fontSize: 12, color: '#FDE68A', marginTop: 1 },
  emptyCard: {
    backgroundColor: colors.field,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.checkboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyCardText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
