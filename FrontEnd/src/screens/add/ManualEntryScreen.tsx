import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import { PrimaryButton } from '../../components/add/Buttons';
import {
  CATEGORY_LABELS,
  CategoryToggle,
  DateField,
  FormField,
  QuantityStepper,
  TextField,
} from '../../components/add/FormControls';
import { InfoCard } from '../../components/add/InfoCard';
import { StepIntro } from '../../components/add/StepIntro';
import { useAddItem } from '../../features/addItem/AddItemContext';
import { useSubmitItem } from '../../features/addItem/useSubmitItem';
import { styles } from '../../styles/add/addScreen.styles';
import { spacing } from '../../styles/theme';

// Figma: "Add manually". For produce, homemade food, or anything without a barcode.
export default function ManualEntryScreen() {
  const insets = useSafeAreaInsets();
  const { draft, update, reset } = useAddItem();
  const { submit, submitting, valid, errors } = useSubmitItem();
  const [showErrors, setShowErrors] = useState(false);

  // Start from a blank form even if the user got here from the barcode screens.
  useEffect(() => {
    reset();
  }, [reset]);

  const isProduce = draft.category === 'produce';

  const handleAdd = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    submit();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AddItemHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepIntro
          eyebrow="MANUAL ENTRY"
          title="Add manually"
          subtitle="For fresh produce, homemade food or anything without a barcode."
        />

        <View style={styles.form}>
          <FormField label="Item name" error={showErrors ? errors.itemName : undefined}>
            <TextField
              value={draft.itemName}
              onChangeText={(itemName) => update({ itemName })}
              placeholder="e.g. Baby Spinach"
              hasError={showErrors && !!errors.itemName}
            />
          </FormField>

          <FormField
            label="Expiration date"
            tag={isProduce ? 'Optional' : undefined}
            error={showErrors ? errors.expirationDate : undefined}
          >
            <DateField
              value={draft.expirationDate}
              onChange={(expirationDate) => update({ expirationDate, dateSource: 'manual' })}
              hasError={showErrors && !!errors.expirationDate}
            />
          </FormField>

          <FormField label="Quantity">
            <QuantityStepper value={draft.quantity} onChange={(quantity) => update({ quantity })} />
          </FormField>

          <FormField label="Add to">
            <CategoryToggle value={draft.category} onChange={(category) => update({ category })} />
          </FormField>

          {isProduce ? (
            <InfoCard
              icon="leaf-outline"
              title="Produce is tracked by time stored"
              body="You can skip the date. MiFoo will show how many days it has been in your kitchen."
            />
          ) : (
            <InfoCard
              icon="information-circle-outline"
              title="No printed expiration date?"
              body="Choose a date you plan to use it by. You can always update it later."
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={[styles.footnote, showErrors && !valid && styles.footnoteDanger]}>
          {showErrors && !valid
            ? 'Fix the highlighted fields to continue.'
            : valid
              ? `This item will be saved to ${CATEGORY_LABELS[draft.category]}.`
              : isProduce
                ? 'Add a name to get started.'
                : 'Add a name and expiration date to get started.'}
        </Text>
        <PrimaryButton icon="add" label="Add item" loading={submitting} onPress={handleAdd} />
      </View>
    </KeyboardAvoidingView>
  );
}
