import { useMemo, type ComponentType } from 'react';
import { Text, View } from 'react-native';

// Route files normally re-export a screen directly. Screens that use camera / date-picker
// native code are loaded through this helper instead. Why: expo-router loads every route
// file when the app starts, and importing a native module that is missing from the installed
// development build crashes the WHOLE app at launch. With this helper only the affected
// screen shows a message, and Home keeps working.
export function lazyScreen(load: () => { default: ComponentType }) {
  return function LazyScreen() {
    const result = useMemo(() => {
      try {
        return { Screen: load().default, error: null };
      } catch (error) {
        return { Screen: null, error: error instanceof Error ? error.message : String(error) };
      }
    }, []);

    if (result.Screen) return <result.Screen />;
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>This build is missing a native module</Text>
        <Text style={{ fontSize: 15, color: '#5F6368' }}>
          Rebuild the development app (npx expo run:android --device), then start the server again.
        </Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{result.error}</Text>
      </View>
    );
  };
}
