import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import {
  MAX_CLASSIFICATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../../features/addItem/validation';
import { CLASSIFICATION_SUGGESTIONS } from '../../features/items/classification';
import { LOCATIONS } from '../../features/items/locations';
import { styles } from '../../styles/add/formControls.styles';
import { colors } from '../../styles/theme';
import type { ItemLocation } from '../../types/item';
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

type DatePickerModule = typeof import('@react-native-community/datetimepicker');
let datePicker: DatePickerModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-community/datetimepicker') as DatePickerModule;
  if (mod?.DateTimePickerAndroid) datePicker = mod;
} catch {
  datePicker = null; // not in this build: DateField uses the typed fallback below
}

// "2026-12-05" is valid; "2026-13-45" and "tomorrow" are not.
function isValidISODate(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && toISODate(parseISODate(text)) === text;
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
  const [typed, setTyped] = useState(value ?? ''); // only used by the typed fallback

  // Keep the typed box in step when the date is set elsewhere (the date scanner, Update screen).
  useEffect(() => {
    if (value && value !== typed) setTyped(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const now = new Date();
  const current = value ? parseISODate(value) : now;
  // Same window the date scanner accepts: up to a year in the past, 15 years ahead.
  const minimumDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const maximumDate = new Date(now.getFullYear() + 15, now.getMonth(), now.getDate());

  if (!datePicker) {
    return (
      <View style={[styles.input, hasError && styles.inputError]}>
        <TextInput
          style={styles.inputText}
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            if (isValidISODate(text)) onChange(text);
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          accessibilityLabel="Expiration date, year-month-day"
        />
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
      </View>
    );
  }
  const { DateTimePickerAndroid, default: DateTimePicker } = datePicker;

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

// ---- LocationToggle: Fridge | Freezer | Pantry (where the item is kept) ------------------
export function LocationToggle({
  value,
  onChange,
}: {
  value: ItemLocation;
  onChange: (location: ItemLocation) => void;
}) {
  return (
    <View style={styles.toggle}>
      {LOCATIONS.map(({ key, label, icon }) => {
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
            <Text style={[styles.toggleLabel, selected && styles.toggleLabelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---- ClassificationField: a text box plus quick-pick chips ("Produce", "Dairy", ...) -------
// Typing anything is fine; "Produce" is the special one (it may skip the expiration date).
export function ClassificationField({
  value,
  onChange,
}: {
  value: string;
  onChange: (classification: string) => void;
}) {
  const current = value.trim().toLowerCase();
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.input}>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Ice Cream"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={MAX_CLASSIFICATION_LENGTH}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
      </View>
      <View style={styles.chipRow}>
        {CLASSIFICATION_SUGGESTIONS.map((label) => {
          const selected = current === label.toLowerCase();
          return (
            <Pressable
              key={label}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(selected ? '' : label)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
