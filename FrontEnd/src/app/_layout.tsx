'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect } from 'react';

import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ThemeProvider, useTheme } from '../features/theme/ThemeContext';
import { colors } from '../styles/theme';

// Keep the splash screen up until we know whether someone is logged in,
// so a logged-in user never sees a flash of the Login screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

// If the app is ever opened straight onto another screen, "index" (Home) sits underneath it.
export const unstable_settings = {
  initialRouteName: 'index',
};

function Routes() {
  const { ready, signedIn } = useAuth();
  const { isDark, mode } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  // key={mode}: when Light / Dark changes, everything below is built again from scratch, so no
  // screen can keep old colors. You stay on the same page (the address does not change) and
  // your login is untouched (AuthProvider is above this line).
  return (
    <Fragment key={mode}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* Only reachable when logged in. Logging out removes them and expo-router
          sends the user to the first available screen (Login). */}
      <Stack.Protected guard={signedIn}>
        {/* The four tab screens (Home, Meals, Pantry, Profile) all switch with no slide, so
            tapping a tab never looks different depending on which tab you tap. Home used to
            slide in from the side while the other three did not. */}
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="meals" options={{ animation: 'none' }} />
        <Stack.Screen name="pantry" options={{ animation: 'none' }} />
        <Stack.Screen name="profile" options={{ animation: 'none' }} />
        {/* Item Info (/item/<id>), opened by tapping an item on Home or Pantry. */}
        <Stack.Screen name="item" options={{ animation: 'slide_from_right' }} />
        {/* Create recipe (/recipe/new) and a saved meal (/recipe/<id>). */}
        <Stack.Screen name="recipe" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add" options={{ animation: 'slide_from_bottom' }} />
      </Stack.Protected>

      {/* Only reachable when logged out. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
    </Fragment>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ThemeProvider>
  );
}
