import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { MAX_NAME_LENGTH, MAX_QUANTITY, MIN_QUANTITY } from '../../features/addItem/validation';
import { styles } from '../../styles/add/formControls.styles';
import { colors } from '../../styles/theme';
import type { ItemCategory } from '../../types/item';
import { formatLongDate, parseISODate, toISODate } from '../../utils/expiry';

// ---- FormField: label (+ small tag such as "From barcode") + control + error -------------
export function FormField({
  label,
  tag,
  error,
  children,
}: {
  label: string;
  tag?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {tag ? <Text style={styles.tag}>{tag}</Text> : null}
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// ---- TextField: the gray text box with a pencil icon -------------------------------------
export function TextField({
  value,
  onChangeText,
  placeholder,
  hasError,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <View style={[styles.input, hasError && styles.inputError]}>
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        returnKeyType="done"
      />
      <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
    </View>
  );
}

// ---- DateField: shows the date; tapping opens the system date picker ----------------------
export function DateField({
  value,
  onChange,
  hasError,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  hasError?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);

  const now = new Date();
  const current = value ? parseISODate(value) : now;
  // Same window the date scanner accepts: up to a year in the past, 15 years ahead.
  const minimumDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const maximumDate = new Date(now.getFullYear() + 15, now.getMonth(), now.getDate());

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable style={[styles.input, hasError && styles.inputError]} onPress={open} accessibilityRole="button">
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value ? formatLongDate(value) : 'Select a date'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }} onPress={() => setIosOpen(false)}>
            <Pressable style={{ backgroundColor: colors.background, padding: 16 }}>
              <DateTimePicker
                value={current}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_event, date) => {
                  if (date) onChange(toISODate(date));
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// ---- QuantityStepper: − [ 1 item ] + ------------------------------------------------------
export function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const canDecrease = value > MIN_QUANTITY;
  const canIncrease = value < MAX_QUANTITY;
  return (
    <View style={styles.stepper}>
      <Pressable
        style={[styles.stepperButton, !canDecrease && styles.stepperButtonDisabled]}
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={20} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.stepperValue}>{value === 1 ? '1 item' : `${value} items`}</Text>
      <Pressable
        style={[styles.stepperButton, !canIncrease && styles.stepperButtonDisabled]}
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

// ---- CategoryToggle: Food Items | Produce Items (maps to category packaged | produce) ------
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  packaged: 'Food Items',
  produce: 'Produce Items',
};

export function CategoryToggle({
  value,
  onChange,
}: {
  value: ItemCategory;
  onChange: (category: ItemCategory) => void;
}) {
  const options: { key: ItemCategory; icon: 'restaurant-outline' | 'leaf-outline' }[] = [
    { key: 'packaged', icon: 'restaurant-outline' },
    { key: 'produce', icon: 'leaf-outline' },
  ];
  return (
    <View style={styles.toggle}>
      {options.map(({ key, icon }) => {
        const selected = value === key;
        return (
          <Pressable
            key={key}
            style={[styles.toggleOption, selected && styles.toggleOptionSelected]}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Ionicons name={icon} size={16} color={selected ? colors.primary : colors.textSecondary} />
            <Text style={[styles.toggleLabel, selected && styles.toggleLabelSelected]}>{CATEGORY_LABELS[key]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
