import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { normalizeUnit, unitLabel } from '../../features/recipes/units';
import { useIngredientSearch } from '../../features/recipes/useIngredientSearch';
import type { RecipeForm } from '../../features/recipes/useRecipeForm';
import { parseQuantity } from '../../features/recipes/quantity';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors } from '../../styles/theme';
import { UnitPicker } from './UnitPicker';

// The gray "Ingredients" card: one row per ingredient (amount, unit, name, delete) and a
// search box that suggests ingredients from your pantry and a list of common ones.
export function IngredientsEditor({ form }: { form: RecipeForm }) {
  const [query, setQuery] = useState('');
  const [pickingFor, setPickingFor] = useState<string | null>(null); // key of the row choosing a unit
  const { results, searching } = useIngredientSearch(query);

  const picking = form.ingredients.find((i) => i.key === pickingFor);
  const typed = query.trim();
  const hasExact = results.some((r) => r.name.toLowerCase() === typed.toLowerCase());

  const add = (name: string, defaultUnit: string | null) => {
    form.addIngredient(name, normalizeUnit(defaultUnit));
    setQuery('');
  };

  return (
    <View style={styles.card}>
      {form.ingredients.length === 0 ? (
        <Text style={styles.emptyIngredients}>No ingredients yet. Search below to add some.</Text>
      ) : null}

      {form.ingredients.map((ing) => {
        const invalid = parseQuantity(ing.quantity) === null;
        return (
          <View key={ing.key} style={styles.ingredientRow}>
            <TextInput
              style={[styles.qtyInput, invalid && styles.qtyInputError]}
              value={ing.quantity}
              onChangeText={(quantity) => form.updateIngredient(ing.key, { quantity })}
              keyboardType="numbers-and-punctuation"
              maxLength={8}
              selectTextOnFocus
              accessibilityLabel={`Amount of ${ing.name}`}
            />
            <Pressable
              style={styles.unitButton}
              onPress={() => setPickingFor(ing.key)}
              accessibilityRole="button"
              accessibilityLabel={`Unit for ${ing.name}: ${unitLabel(ing.unit)}`}
            >
              <Text style={styles.unitText} numberOfLines={1}>
                {unitLabel(ing.unit)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.ingredientName} numberOfLines={2}>
              {ing.name}
            </Text>
            <Pressable
              style={styles.trashButton}
              onPress={() => form.removeIngredient(ing.key)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${ing.name}`}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.searchLabel}>Search to add another ingredient</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients"
          placeholderTextColor={colors.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={60}
          accessibilityLabel="Search ingredients"
        />
        {searching ? <ActivityIndicator size="small" color={colors.textSecondary} /> : null}
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textPlaceholder} />
          </Pressable>
        ) : null}
      </View>

      {results.map((s) => (
        <Pressable
          key={`${s.source}-${s.name}`}
          style={styles.suggestionRow}
          onPress={() => add(s.name, s.defaultUnit)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${s.name}`}
        >
          <View style={styles.suggestionText}>
            <Text style={styles.suggestionName}>{s.name}</Text>
            {s.note ? <Text style={styles.suggestionNote}>{s.note}</Text> : null}
          </View>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
        </Pressable>
      ))}

      {typed && !hasExact ? (
        <Pressable
          style={styles.suggestionRow}
          onPress={() => add(typed, null)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${typed} as a new ingredient`}
        >
          <View style={styles.suggestionText}>
            <Text style={styles.suggestionName}>Add "{typed}"</Text>
            <Text style={styles.suggestionNote}>Use your own ingredient</Text>
          </View>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
        </Pressable>
      ) : null}

      <UnitPicker
        visible={pickingFor !== null}
        selected={picking?.unit ?? null}
        onSelect={(unit) => pickingFor && form.updateIngredient(pickingFor, { unit })}
        onClose={() => setPickingFor(null)}
      />
    </View>
  );
}
