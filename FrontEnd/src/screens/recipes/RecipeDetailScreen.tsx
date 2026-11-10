import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, TextLink } from '../../components/Buttons';
import { CookSheet } from '../../components/recipes/CookSheet';
import { RecipeForm } from '../../components/recipes/RecipeForm';
import { RecipeHeader } from '../../components/recipes/RecipeHeader';
import { formatQuantity } from '../../features/recipes/quantity';
import { saveRecipe } from '../../features/recipes/saveRecipe';
import { useRecipeForm } from '../../features/recipes/useRecipeForm';
import { cookRecipe, deleteRecipe, fetchRecipe } from '../../services/api';
import { ApiError } from '../../services/api';
import { styles as form } from '../../styles/recipes/recipeForm.styles';
import { styles } from '../../styles/recipes/meals.styles';
import { colors, spacing, statusColors } from '../../styles/theme';
import type { Recipe, RecipeIngredient } from '../../types/recipe';

function ingredientText(i: RecipeIngredient): string {
  return `${formatQuantity(i.quantity)}${i.unit ? ` ${i.unit}` : ''} ${i.name}`;
}

// A saved meal. Plain text for reading while you cook; the pencil button at the top switches
// to edit mode (the same form as Create recipe), and "I cooked this" updates your kitchen.
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [cookOpen, setCookOpen] = useState(false);
  const [cookBusy, setCookBusy] = useState(false);
  const [cookError, setCookError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecipe(await fetchRecipe(id));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? 'This meal no longer exists.' : e instanceof Error ? e.message : 'Could not load this meal.');
    }
  }, [id]);

  // Reload when shown, so "in your kitchen" marks match what is stored right now.
  useFocusEffect(
    useCallback(() => {
      if (!editing) load();
    }, [load, editing]),
  );

  async function confirmCook(itemIds: string[]) {
    if (!recipe) return;
    setCookBusy(true);
    setCookError(null);
    try {
      const result = await cookRecipe(recipe.id, itemIds);
      setCookOpen(false);
      await load();
      Alert.alert('Kitchen updated', `${result.updated} item${result.updated === 1 ? '' : 's'} reduced, ${result.removed} removed.`);
    } catch (e) {
      setCookError(e instanceof Error ? e.message : 'Could not update your kitchen.');
    } finally {
      setCookBusy(false);
    }
  }

  const editButton = recipe ? (
    <Pressable
      style={form.roundChip}
      onPress={() => setEditing((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={editing ? 'Stop editing' : 'Edit meal'}
    >
      <Ionicons name={editing ? 'eye-outline' : 'create-outline'} size={22} color={editing ? colors.primary : colors.textPrimary} />
    </Pressable>
  ) : null;

  const shell = (body: React.ReactNode) => (
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
        <RecipeHeader right={editButton} />
        {body}
      </KeyboardAwareScroll>
    </View>
  );

  if (!recipe) {
    return shell(
      error ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <TextLink label="Try again" onPress={load} />
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ),
    );
  }

  if (editing) {
    return shell(
      <EditRecipe
        recipe={recipe}
        onSaved={(updated) => {
          setRecipe(updated);
          setEditing(false);
        }}
      />,
    );
  }

  const canCook = recipe.ingredients.some((i) => i.matches.length > 0);
  return (
    <>
      {shell(
        <>
          {recipe.imageUrl ? <Image source={{ uri: recipe.imageUrl }} style={styles.hero} resizeMode="cover" /> : null}
          <View style={{ gap: spacing.md }}>
            <Text style={styles.detailTitle} accessibilityRole="header">
              {recipe.title}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.chip, recipe.canMakeNow ? styles.chipReady : { backgroundColor: colors.field }]}>
                <Text style={recipe.canMakeNow ? styles.chipReadyText : [styles.chipSoonText, { color: colors.textSecondary }]}>
                  {recipe.canMakeNow
                    ? 'You have everything'
                    : `You have ${recipe.ingredientsOwned} of ${recipe.ingredientCount} ingredients`}
                </Text>
              </View>
              {recipe.usesExpiringSoon.length > 0 ? (
                <View style={[styles.chip, styles.chipSoon]}>
                  <Text style={styles.chipSoonText}>Uses {recipe.usesExpiringSoon.join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.card}>
              {recipe.ingredients.map((ing) => {
                const best = ing.matches[0];
                return (
                  <View key={ing.id} style={styles.ingredientRow}>
                    <Ionicons
                      name={ing.inPantry ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={ing.inPantry ? statusColors.safe.dot : colors.checkboxBorder}
                      accessibilityLabel={ing.inPantry ? 'In your kitchen' : 'Not in your kitchen'}
                    />
                    <View style={styles.ingredientText}>
                      <Text style={styles.ingredientLine}>{ingredientText(ing)}</Text>
                      {best ? (
                        <Text style={[styles.ingredientSub, best.expiringSoon && styles.ingredientSubSoon]}>
                          In your kitchen: {best.itemName}
                          {best.expiringSoon ? ' · use soon' : ''}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Steps</Text>
            <View style={styles.card}>
              {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {canCook ? (
            <PrimaryButton
              label="I cooked this"
              icon="restaurant-outline"
              onPress={() => {
                setCookError(null);
                setCookOpen(true);
              }}
            />
          ) : null}
        </>,
      )}
      <CookSheet
        visible={cookOpen}
        recipe={recipe}
        busy={cookBusy}
        error={cookError}
        onConfirm={confirmCook}
        onClose={() => setCookOpen(false)}
      />
    </>
  );
}

// Edit mode. A separate component so the form starts fresh from the saved meal each time.
function EditRecipe({ recipe, onSaved }: { recipe: Recipe; onSaved: (r: Recipe) => void }) {
  const state = useRecipeForm(recipe);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !state.canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { recipe: saved, photoError } = await saveRecipe(state, recipe);
      if (photoError) Alert.alert('Meal saved', `The photo could not be updated: ${photoError}`);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.');
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this meal?', `"${recipe.title}" will be removed for good.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipe.id);
            router.dismissTo('/meals');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete the meal.');
          }
        },
      },
    ]);
  }

  return (
    <>
      <View>
        <Text style={form.pageTitle} accessibilityRole="header">
          Edit meal
        </Text>
        <Text style={form.pageSubtitle}>Change anything, then save.</Text>
      </View>
      <RecipeForm
        form={state}
        submitLabel="Save changes"
        onSubmit={submit}
        busy={busy}
        error={error}
        footerExtra={
          <Pressable style={styles.deleteLink} onPress={confirmDelete} accessibilityRole="button">
            <Text style={styles.deleteText}>Delete meal</Text>
          </Pressable>
        }
      />
    </>
  );
}
