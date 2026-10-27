import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '../../styles/add/addItemHeader.styles';
import { colors, spacing } from '../../styles/theme';

// Top bar of every add-item screen: back arrow, "Add an item", close (X).
// Back goes one step back; X closes the whole flow and returns to Home.
export function AddItemHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        style={styles.circleButton}
        onPress={() => (router.canGoBack() ? router.back() : router.dismissTo('/'))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>Add an item</Text>
      <Pressable
        style={styles.circleButton}
        onPress={() => router.dismissTo('/')}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
