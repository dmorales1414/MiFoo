import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '../features/auth/AuthContext';

// Keep the splash screen up until we know whether someone is logged in,
// so a logged-in user never sees a flash of the Login screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

// If the app is ever opened straight onto another screen, "index" (Home) sits underneath it.
export const unstable_settings = {
  initialRouteName: 'index',
};

function Routes() {
  const { ready, signedIn } = useAuth();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only reachable when logged in. Logging out removes them and expo-router
          sends the user to the first available screen (Login). */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" options={{ animation: 'none' }} />
        <Stack.Screen name="add" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="explore" options={{ headerShown: true, title: 'Explore' }} />
      </Stack.Protected>

      {/* Only reachable when logged out. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Routes />
    </AuthProvider>
  );
}
