import { router } from 'expo-router';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeForm } from '../../components/recipes/RecipeForm';
import { RecipeHeader } from '../../components/recipes/RecipeHeader';
import { saveRecipe } from '../../features/recipes/saveRecipe';
import { useRecipeForm } from '../../features/recipes/useRecipeForm';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors, spacing } from '../../styles/theme';

// "Add a Meal" -> this screen. Title, ingredients and steps are required; the photo is optional.
export default function CreateRecipeScreen() {
  const insets = useSafeAreaInsets();
  const form = useRecipeForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !form.canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { photoError } = await saveRecipe(form);
      if (photoError) Alert.alert('Meal saved', `The photo could not be uploaded: ${photoError}\n\nYou can add it again by editing the meal.`);
      router.dismissTo('/meals');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the meal.');
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xxl * 2,
          paddingHorizontal: spacing.xl,
          gap: spacing.xl,
        }}
      >
        <RecipeHeader />
        <View>
          <Text style={styles.pageTitle} accessibilityRole="header">
            Create recipe
          </Text>
          <Text style={styles.pageSubtitle}>Meal title, ingredients and steps are required.</Text>
        </View>
        <RecipeForm form={form} submitLabel="Create recipe" onSubmit={submit} busy={busy} error={error} />
      </KeyboardAwareScroll>
    </View>
  );
}
