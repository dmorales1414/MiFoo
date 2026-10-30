import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { styles } from '../../styles/auth/auth.styles';
import { colors } from '../../styles/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  /** Adds the eye icon that shows/hides the text. */
  secret?: boolean;
}

// Label + gray text box + optional error, used by Login, Sign Up and the profile editor.
export const AuthTextField = forwardRef<TextInput, Props>(function AuthTextField(
  { label, error, hint, secret, ...inputProps },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, !!error && styles.inputError]}>
        <TextInput
          ref={ref}
          style={styles.inputText}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={secret && hidden}
          accessibilityLabel={label}
          {...inputProps}
        />
        {secret ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});
