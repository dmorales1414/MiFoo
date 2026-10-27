import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Makes sure that if the app is ever opened straight onto another screen
// (for example through a deep link to /explore), "index" (HomeScreen) sits
// underneath it, so going back lands on Home instead of closing the app.
export const unstable_settings = {
  initialRouteName: 'index',
};

// The root layout wraps every screen in the app. For now it is a simple Stack
// (screens that push on top of each other). When you build the Meals, Pantry and
// Profile screens, this is the file you will change to add a tab bar.
export default function RootLayout() {
  return (
    <>
      {/* Dark icons (clock, battery) because the screens have a white background. */}
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        {/* "index" is the route for "/", the first screen the app opens. */}
        <Stack.Screen name="index" />
        {/* The add-item flow (scan barcode -> confirm -> scan date -> review, or manual). */}
        <Stack.Screen name="add" options={{ animation: 'slide_from_bottom' }} />
        {/* Placeholder: shows a header so there is a back button while you test. */}
        <Stack.Screen name="explore" options={{ headerShown: true, title: 'Explore' }} />
      </Stack>
    </>
  );
}
