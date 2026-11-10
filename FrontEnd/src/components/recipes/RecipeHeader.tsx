import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors } from '../../styles/theme';

// Goes back if there is a screen to go back to, otherwise to the Meals list.
export function goBackToMeals() {
  if (router.canGoBack()) router.back();
  else router.replace('/meals');
}

// Top row of the recipe screens: "< Meals" chip on the left, extra buttons + close (X) on the right.
export function RecipeHeader({ right, onBack = goBackToMeals }: { right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.backChip} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Meals">
        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        <Text style={styles.chipLabel}>Meals</Text>
      </Pressable>
      <View style={styles.headerRight}>
        {right}
        <Pressable
          style={styles.roundChip}
          onPress={() => router.dismissTo('/meals')}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
