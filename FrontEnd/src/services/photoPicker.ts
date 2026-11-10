// Choosing a photo for a meal. expo-image-picker is a native module: until the app is rebuilt
// with it (`eas build`), the require() fails and isPhotoPickerAvailable() is false, so the
// Add photo tile explains that instead of crashing the app.
export interface PickedPhoto {
  uri: string; // local file, used to show a preview
  base64: string; // sent to the backend
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}

interface PickerResult {
  canceled: boolean;
  assets?: { uri: string; base64?: string | null; mimeType?: string | null }[];
}
interface PickerModule {
  launchImageLibraryAsync(options: object): Promise<PickerResult>;
  launchCameraAsync(options: object): Promise<PickerResult>;
  requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
}

let picker: PickerModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-image-picker') as PickerModule;
  if (typeof mod?.launchImageLibraryAsync === 'function') picker = mod;
} catch {
  picker = null;
}

export function isPhotoPickerAvailable(): boolean {
  return picker !== null;
}

// Small, compressed pictures keep uploads fast (the backend accepts up to 5 MB).
const OPTIONS = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true };

function toPhoto(result: PickerResult): PickedPhoto | null {
  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset?.base64) return null;
  const type = asset.mimeType === 'image/png' || asset.mimeType === 'image/webp' ? asset.mimeType : 'image/jpeg';
  return { uri: asset.uri, base64: asset.base64, contentType: type };
}

export async function pickFromLibrary(): Promise<PickedPhoto | null> {
  if (!picker) return null;
  return toPhoto(await picker.launchImageLibraryAsync(OPTIONS));
}

// Returns null if cancelled; throws Error('camera-denied') when permission is refused.
export async function takePhoto(): Promise<PickedPhoto | null> {
  if (!picker) return null;
  const permission = await picker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('camera-denied');
  return toPhoto(await picker.launchCameraAsync(OPTIONS));
}
