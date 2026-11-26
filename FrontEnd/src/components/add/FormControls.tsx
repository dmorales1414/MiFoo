'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import {
  MAX_CLASSIFICATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../../features/addItem/validation';
import { CLASSIFICATION_SUGGESTIONS } from '../../features/items/classification';
import { LOCATIONS } from '../../features/items/locations';
import { styles } from '../../styles/add/formControls.styles';
import { colors, getThemeMode } from '../../styles/theme';
import type { ItemLocation } from '../../types/item';
import { parseISODate, toISODate } from '../../utils/expiry';

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

// ---- DateField: type the date, or tap the calendar button to pick it --------------------
// You can simply type digits ("12312026" turns into 12/31/2026; the slashes are added for you).
// The calendar button on the right opens the system date picker when you would rather tap.
//
// The date picker is a native module. An app build made before it was added (for example an
// emulator that still has an old development build) does not contain it, and importing it at the
// top of this file crashed the whole add-item screen ("RNCDatePicker could not be found").
// So it is loaded safely here, like the other native modules; when it is missing the calendar
// button is simply hidden and typing still works.
type DatePickerModule = typeof import('@react-native-community/datetimepicker');
let datePicker: DatePickerModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-community/datetimepicker') as DatePickerModule;
  if (mod?.DateTimePickerAndroid) datePicker = mod;
} catch {
  datePicker = null; // not in this build: DateField is typing only
}

// '2026-12-31' -> '12/31/2026'
function isoToTyped(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y}` : '';
}

// Keeps only the digits and adds the slashes: '1231' -> '12/31', '12312026' -> '12/31/2026'.
function formatTyped(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// '12/31/2026' -> '2026-12-31'. Returns null until the text is a real calendar date
// ("02/30/2026" and "13/01/2026" are rejected). A pasted '2026-12-31' also works.
function typedToISO(text: string): string | null {
  const pasted = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(pasted)) {
    return toISODate(parseISODate(pasted)) === pasted ? pasted : null;
  }
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  if (Number(yyyy) < 1900) return null;
  const iso = `${yyyy}-${mm}-${dd}`;
  return toISODate(parseISODate(iso)) === iso ? iso : null;
}

export function DateField({
  value,
  onChange,
  hasError,
}: {
  value: string | null;
  /** Called with the date as 'YYYY-MM-DD', or null while the typed text is not a full valid date. */
  onChange: (iso: string | null) => void;
  hasError?: boolean;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [text, setText] = useState(isoToTyped(value));

  // Keep the box in step when the date is set somewhere else (the date scanner, the calendar,
  // the Update screen). While you are typing a half-finished date, value is null and so is
  // the parsed text, so nothing here overwrites what you are typing.
  useEffect(() => {
    if (value !== typedToISO(text)) setText(isoToTyped(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const now = new Date();
  const current = value ? parseISODate(value) : now;
  // Same window the date scanner accepts: up to a year in the past, 15 years ahead.
  const minimumDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const maximumDate = new Date(now.getFullYear() + 15, now.getMonth(), now.getDate());

  const handleText = (raw: string) => {
    const formatted = /^\d{4}-/.test(raw.trim()) ? raw.trim().slice(0, 10) : formatTyped(raw);
    setText(formatted);
    onChange(typedToISO(formatted));
  };

  const toggleCalendar = () => {
    if (!datePicker) return;
    if (calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    Keyboard.dismiss();
    setCalendarOpen(true);
    if (Platform.OS === 'android') {
      datePicker.DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          setCalendarOpen(false);
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
    }
  };

  const complete = text.length === 10;
  const invalid = complete && typedToISO(text) === null;
  const DateTimePicker = datePicker?.default;

  return (
    <>
      <View style={[styles.input, (hasError || invalid) && styles.inputError]}>
        <TextInput
          style={styles.inputText}
          value={text}
          onChangeText={handleText}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
          maxLength={10}
          returnKeyType="done"
          accessibilityLabel="Expiration date, month day year"
        />
        {datePicker ? (
          <Pressable
            onPress={toggleCalendar}
            style={[styles.calendarButton, calendarOpen && styles.calendarButtonOn]}
            accessibilityRole="button"
            accessibilityState={{ expanded: calendarOpen }}
            accessibilityLabel={calendarOpen ? 'Close calendar' : 'Open calendar'}
            hitSlop={8}
          >
            <Ionicons name="calendar-outline" size={18} color={calendarOpen ? colors.onPrimary : colors.textSecondary} />
          </Pressable>
        ) : (
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        )}
      </View>
      {invalid ? <Text style={styles.error}>That is not a real date. Use month/day/year, like 12/31/2026.</Text> : null}

      {Platform.OS === 'ios' && DateTimePicker && (
        <Modal visible={calendarOpen} transparent animationType="slide" onRequestClose={() => setCalendarOpen(false)}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }} onPress={() => setCalendarOpen(false)}>
            <Pressable style={{ backgroundColor: colors.surface, padding: 16 }}>
              <DateTimePicker
                value={current}
                mode="date"
                display="inline"
                themeVariant={getThemeMode()}
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
        <Ionicons name="add" size={20} color={colors.primaryText} />
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
            <Ionicons name={icon} size={16} color={selected ? colors.primaryText : colors.textSecondary} />
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
