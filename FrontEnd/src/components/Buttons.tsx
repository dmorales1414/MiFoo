import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { styles } from '../styles/add/buttons.styles';
import { colors } from '../styles/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}

// The big blue pill button ("Yes, scan expiration date", "Add item"...).
export function PrimaryButton({ label, onPress, icon, disabled, loading, small }: PrimaryButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      style={[styles.primary, small && styles.small, inactive && styles.primaryDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={colors.onPrimary} />}
          <Text style={styles.primaryLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// Plain blue text under a button ("Enter item manually").
export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.link} accessibilityRole="link">
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}
