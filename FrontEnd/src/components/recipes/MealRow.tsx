import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { styles } from '../../styles/recipes/meals.styles';
import { colors } from '../../styles/theme';
import type { RecipeSummary } from '../../types/recipe';

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
        <Text style={styles.rowMeta}>
          {recipe.ingredientsOwned} of {recipe.ingredientCount} ingredients in your kitchen
        </Text>
        {recipe.canMakeNow || soon.length > 0 ? (
          <View style={styles.chipRow}>
            {recipe.canMakeNow ? (
              <View style={[styles.chip, styles.chipReady]}>
                <Text style={styles.chipReadyText}>Ready to cook</Text>
              </View>
            ) : null}
            {soon.length > 0 ? (
              <View style={[styles.chip, styles.chipSoon]}>
                <Text style={styles.chipSoonText} numberOfLines={1}>
                  Uses {soon.slice(0, 2).join(', ')}
                  {soon.length > 2 ? ` +${soon.length - 2}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
