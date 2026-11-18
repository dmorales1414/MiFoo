import { Stack } from 'expo-router';

// Item Info (/item/<id>) is the only screen in this folder.
export default function ItemLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
