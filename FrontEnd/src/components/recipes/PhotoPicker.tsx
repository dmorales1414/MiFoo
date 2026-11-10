import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import type { PhotoState } from '../../features/recipes/useRecipeForm';
import { isPhotoPickerAvailable, pickFromLibrary, takePhoto, type PickedPhoto } from '../../services/photoPicker';
import { styles } from '../../styles/recipes/recipeForm.styles';
import { colors } from '../../styles/theme';

interface Props {
  photo: PhotoState;
  onChange: (photo: PhotoState) => void;
}

// The "Add photo / Optional" tile. Shows the picture once chosen, with a small X to remove it.
export function PhotoPicker({ photo, onChange }: Props) {
  const uri = photo.kind === 'saved' ? photo.url : photo.kind === 'new' ? photo.photo.uri : null;

  const choose = (picked: PickedPhoto | null) => {
    if (picked) onChange({ kind: 'new', photo: picked });
  };

  const openChooser = () => {
    if (!isPhotoPickerAvailable()) {
      Alert.alert(
        'Photos need a new app build',
        'Photo support (expo-image-picker) is not in this build of the app yet. Make a new EAS build to use it. Your meal can be saved without a photo.',
      );
      return;
    }
    Alert.alert('Meal photo', undefined, [
      {
        text: 'Take photo',
        onPress: async () => {
          try {
            choose(await takePhoto());
          } catch {
            Alert.alert('Camera permission needed', 'Allow camera access in your phone settings to take a photo.');
          }
        },
      },
      { text: 'Choose from library', onPress: async () => choose(await pickFromLibrary()) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      style={styles.photoTile}
      onPress={openChooser}
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Change photo' : 'Add photo'}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
          <Pressable
            style={styles.photoRemove}
            onPress={() => onChange({ kind: 'none' })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="camera-outline" size={26} color={colors.primary} />
          <Text style={styles.photoLabel}>Add photo</Text>
          <Text style={styles.photoOptional}>Optional</Text>
        </View>
      )}
    </Pressable>
  );
}
