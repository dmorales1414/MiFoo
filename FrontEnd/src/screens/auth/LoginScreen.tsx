import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthTextField } from '../../components/auth/AuthTextField';
import { PrimaryButton } from '../../components/Buttons';
import { useAuth } from '../../features/auth/AuthContext';
import { styles } from '../../styles/auth/auth.styles';
import { colors } from '../../styles/theme';

export default function LoginScreen() {
  const { logIn } = useAuth();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await logIn(username.trim(), password);
      // Nothing to navigate: the route guard in app/_layout.tsx swaps to Home once signed in.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log in.');
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to see what is in your kitchen.</Text>
        </View>

        <View style={styles.form}>
          <AuthTextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AuthTextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secret
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {error ? (
            <View style={styles.banner} accessibilityLiveRegion="polite">
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}
          <PrimaryButton label="Login" onPress={submit} disabled={!canSubmit} loading={busy} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't Have An Account?</Text>
          <Link href="/signup" replace style={styles.switchLink}>
            Sign Up
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
