import { Stack } from 'expo-router';

// /recipe/new (Create recipe) and /recipe/<id> (a saved meal, with edit mode).
export default function RecipeLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
