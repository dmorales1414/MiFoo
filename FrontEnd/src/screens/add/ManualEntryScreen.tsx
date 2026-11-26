import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import {
  ClassificationField,
  DateField,
  FormField,
  LocationToggle,
  QuantityStepper,
  TextField,
} from '../../components/add/FormControls';
import { InfoCard } from '../../components/add/InfoCard';
import { StepIntro } from '../../components/add/StepIntro';
import { PrimaryButton, TextLink } from '../../components/Buttons';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import { useAddItem } from '../../features/addItem/AddItemContext';
import { useSubmitItem } from '../../features/addItem/useSubmitItem';
import { isProduceClassification } from '../../features/items/classification';
import { LOCATION_LABELS } from '../../features/items/locations';
import { fetchItem } from '../../services/api';
import { styles } from '../../styles/add/addScreen.styles';
import { colors, spacing } from '../../styles/theme';
import { useTheme } from '../../features/theme/ThemeContext';

// Figma: "Add manually". For produce, homemade food, or anything without a barcode.
// Opened with ?edit=<item id> (the Update button on Item Info), the same form changes a stored
// item instead.
export default function ManualEntryScreen() {
  useTheme(); // draw again when Light / Dark changes
  const insets = useSafeAreaInsets();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { draft, update, reset, startFromItem } = useAddItem();
  const { submit, submitting, valid, errors } = useSubmitItem();
  const [showErrors, setShowErrors] = useState(false);
  const [loadingItem, setLoadingItem] = useState(!!edit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editing = !!edit;

  // New item: start from a blank form even if the user got here from the barcode screens.
  // Update: load the stored item into the form.
  const load = async () => {
    if (!edit) {
      reset();
      return;
    }
    setLoadingItem(true);
    setLoadError(null);
    try {
      startFromItem(await fetchItem(String(edit)));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load this item.');
    } finally {
      setLoadingItem(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit]);

  const isProduce = isProduceClassification(draft.classification);

  const handleAdd = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    submit();
  };

  if (editing && (loadingItem || loadError)) {
    return (
      <View style={styles.root}>
        <AddItemHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl }}>
          {loadError ? (
            <>
              <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>{loadError}</Text>
              <TextLink label="Try again" onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={colors.primaryText} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AddItemHeader />
      <KeyboardAwareScroll
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepIntro
          eyebrow={editing ? 'UPDATE ITEM' : 'MANUAL ENTRY'}
          title={editing ? 'Update item' : 'Add manually'}
          subtitle={
            editing
              ? 'Change anything below, then save.'
              : 'For fresh produce, homemade food or anything without a barcode.'
          }
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

          <FormField label="Classification" tag="Kind of food">
            <ClassificationField value={draft.classification} onChange={(classification) => update({ classification })} />
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

          <FormField label="Stored in">
            <LocationToggle value={draft.location} onChange={(location) => update({ location })} />
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
              body="Choose a date you plan to use it by, or classify it as Produce to skip the date."
            />
          )}
        </View>
      </KeyboardAwareScroll>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={[styles.footnote, showErrors && !valid && styles.footnoteDanger]}>
          {showErrors && !valid
            ? 'Fix the highlighted fields to continue.'
            : valid
              ? `This item will be stored in your ${LOCATION_LABELS[draft.location]}.`
              : isProduce
                ? 'Add a name to get started.'
                : 'Add a name and expiration date to get started.'}
        </Text>
        <PrimaryButton
          icon={editing ? 'checkmark' : 'add'}
          label={editing ? 'Save changes' : 'Add item'}
          loading={submitting}
          onPress={handleAdd}
        />
      </View>
    </View>
  );
}
