import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemHeader } from '../../components/add/AddItemHeader';
import { PrimaryButton } from '../../components/Buttons';
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
import { colors, spacing } from '../../styles/theme';
import { daysUntil, formatUntilExpiration } from '../../utils/expiry';

// Step 3 of 3 (Figma: "Review & add item"). Everything found so far, editable, then saved.
export default function ReviewItemScreen() {
  const insets = useSafeAreaInsets();
  const { draft, update } = useAddItem();
  const { submit, submitting, valid, errors } = useSubmitItem();
  const [showErrors, setShowErrors] = useState(false);
  const product = draft.product;

  if (!product) return <Redirect href="/add/scan-barcode" />;

  const isProduce = draft.category === 'produce';
  const nameFromBarcode = draft.itemName === product.itemName;
  const subtitleParts = [product.brand, draft.itemName, product.quantityText].filter(Boolean);

  const handleAdd = () => {
    if (!valid) {
      setShowErrors(true); // reveal the red messages instead of silently doing nothing
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
          eyebrow="REVIEW & ADD · 3 OF 3"
          step={3}
          title="Review & add item"
          subtitle="Everything look right? You can edit any scanned detail before saving."
        />

        <View style={styles.sectionPadding}>
          <View style={styles.summaryCard}>
            <View style={styles.thumb}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.thumbImage} resizeMode="contain" />
              ) : (
                <Ionicons name="cube-outline" size={26} color={colors.placeholderImage} />
              )}
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle} numberOfLines={2}>
                {subtitleParts.join(' · ')}
              </Text>
              <View style={styles.summaryLine}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={draft.expirationDate ? colors.success : colors.textSecondary}
                />
                <Text style={draft.expirationDate ? styles.summaryMeta : styles.summaryMetaMuted}>
                  {draft.expirationDate
                    ? formatUntilExpiration(daysUntil(draft.expirationDate))
                    : 'No expiration date yet'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <FormField
            label="Item name"
            tag={nameFromBarcode ? 'From barcode' : 'Edited'}
            error={showErrors ? errors.itemName : undefined}
          >
            <TextField
              value={draft.itemName}
              onChangeText={(itemName) => update({ itemName })}
              placeholder="e.g. Baby Spinach"
              hasError={showErrors && !!errors.itemName}
            />
          </FormField>

          <FormField
            label="Expiration date"
            tag={isProduce ? 'Optional' : draft.dateSource === 'scan' ? 'From date scan' : undefined}
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

          {isProduce && (
            <InfoCard
              icon="leaf-outline"
              title="Produce is tracked by time stored"
              body="Without an expiration date, MiFoo shows how many days this has been in your kitchen."
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={[styles.footnote, showErrors && !valid && styles.footnoteDanger]}>
          {showErrors && !valid
            ? 'Fix the highlighted fields to continue.'
            : `This item will be saved to ${CATEGORY_LABELS[draft.category]}.`}
        </Text>
        <PrimaryButton icon="add" label="Add item" loading={submitting} onPress={handleAdd} />
      </View>
    </KeyboardAvoidingView>
  );
}
