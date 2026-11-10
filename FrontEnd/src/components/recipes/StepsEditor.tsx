import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { MAX_STEP_LENGTH, type RecipeForm } from '../../features/recipes/useRecipeForm';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors } from '../../styles/theme';

// Numbered step cards (tap one to edit it) and a box to add the next step.
// Pasting several lines and pressing + adds one step per line.
export function StepsEditor({ form }: { form: RecipeForm }) {
  return (
    <View style={{ gap: 10 }}>
      {form.steps.map((step, index) => (
        <View key={step.key} style={styles.stepCard}>
          <Text style={styles.stepNumber}>{index + 1}.</Text>
          <TextInput
            style={styles.stepInput}
            value={step.text}
            onChangeText={(text) => form.updateStep(step.key, text)}
            multiline
            maxLength={MAX_STEP_LENGTH}
            accessibilityLabel={`Step ${index + 1}`}
          />
          <Pressable
            style={styles.stepRemove}
            onPress={() => form.removeStep(step.key)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove step ${index + 1}`}
          >
            <Ionicons name="close-circle" size={20} color={colors.textPlaceholder} />
          </Pressable>
        </View>
      ))}

      <View style={styles.addStepCard}>
        <TextInput
          style={styles.stepInput}
          value={form.stepInput}
          onChangeText={form.setStepInput}
          placeholder={'Describe how to make your meal,\none step per line.'}
          placeholderTextColor={colors.textPlaceholder}
          multiline
          accessibilityLabel="Add a step"
        />
        <Pressable
          style={styles.addCircle}
          onPress={form.addStepsFromInput}
          accessibilityRole="button"
          accessibilityLabel="Add step"
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
