import type { ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

import type { RecipeForm as RecipeFormState } from '../../features/recipes/useRecipeForm';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors, spacing } from '../../styles/theme';
import { PrimaryButton } from '../Buttons';
import { IngredientsEditor } from './IngredientsEditor';
import { PhotoPicker } from './PhotoPicker';
import { StepsEditor } from './StepsEditor';

interface Props {
  form: RecipeFormState;
  submitLabel: string;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  footerExtra?: ReactNode; // for example the Delete button on the edit screen
}

// Everything under the page title: photo + name, ingredients, steps, and the save button.
// Used by both the Create recipe screen and the Edit mode of a meal.
export function RecipeForm({ form, submitLabel, onSubmit, busy, error, footerExtra }: Props) {
  const hint =
    form.missing.length > 0
      ? `Add ${form.missing.join(', ').replace(/, ([^,]*)$/, ' and $1')} to save to Meals.`
      : form.badAmounts > 0
        ? 'Check the amounts: use numbers like 2, 0.5 or 1/2.'
        : 'Ready to save to Meals.';

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={styles.topRow}>
        <PhotoPicker photo={form.photo} onChange={form.setPhoto} />
        <View style={styles.titleColumn}>
          <Text style={styles.sectionLabel}>
            Meal title <Text style={styles.sectionHint}>(required)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={form.setTitle}
            placeholder="Name your meal"
            placeholderTextColor={colors.textPlaceholder}
            maxLength={200}
            autoCapitalize="words"
            returnKeyType="done"
            accessibilityLabel="Meal title"
          />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          <View style={styles.requiredPill}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        </View>
        <IngredientsEditor form={form} />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>
          Steps <Text style={styles.sectionHint}>(required)</Text>
        </Text>
        <StepsEditor form={form} />
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={styles.footerHint}>{hint}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <PrimaryButton label={submitLabel} onPress={onSubmit} disabled={!form.canSubmit} loading={busy} />
        {footerExtra}
      </View>
    </View>
  );
}
