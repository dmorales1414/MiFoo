import { Ionicons } from '@expo/vector-icons';
import type { PermissionResponse } from 'expo-camera';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../styles/theme';
import { PrimaryButton } from '../Buttons';

interface Props {
  permission: PermissionResponse | null;
  onRequest: () => void;
}

// Shown inside the camera area until the user allows camera access.
export function CameraPermissionPrompt({ permission, onRequest }: Props) {
  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;
  return (
    <View style={styles.wrap}>
      <Ionicons name="camera-outline" size={34} color="#FFFFFF" />
      <Text style={styles.text}>
        {blocked
          ? 'Camera access is turned off. Enable it in Settings to scan.'
          : 'MiFoo needs the camera to scan barcodes and dates.'}
      </Text>
      <PrimaryButton
        small
        label={blocked ? 'Open Settings' : 'Allow camera'}
        onPress={blocked ? () => Linking.openSettings() : onRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  text: { color: '#FFFFFF', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
