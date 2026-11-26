'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { styles } from '../../styles/recipes/meals.styles';
import { colors, statusColors } from '../../styles/theme';
import type { RecipeSummary } from '../../types/recipe';

// "11/11 Pantry Match": green when you have every ingredient, amber when you have at least
// half, gray otherwise.
export function PantryMatchChip({ owned, total }: { owned: number; total: number }) {
  const palette =
    total > 0 && owned >= total
      ? statusColors.safe
      : total > 0 && owned / total >= 0.5
        ? statusColors.useSoon
        : statusColors.none;
  return (
    <View style={styles.matchRow}>
      <View style={[styles.matchCount, { backgroundColor: palette.badgeBackground }]}>
        <Text style={[styles.matchCountText, { color: palette.badgeText }]}>
          {owned}/{total}
        </Text>
      </View>
      <Text style={styles.matchLabel}>Pantry Match</Text>
    </View>
  );
}

// One meal in the Meals list: picture, title, and how it relates to what you have stored.
export function MealRow({ recipe }: { recipe: RecipeSummary }) {
  const soon = recipe.usesExpiringSoon;
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
    >
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="restaurant-outline" size={26} color={colors.textPlaceholder} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <PantryMatchChip owned={recipe.ingredientsOwned} total={recipe.ingredientCount} />
        {soon.length > 0 ? (
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.chipSoon]}>
              <Text style={styles.chipSoonText} numberOfLines={1}>
                Uses {soon.slice(0, 2).join(', ')}
                {soon.length > 2 ? ` +${soon.length - 2}` : ''}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
