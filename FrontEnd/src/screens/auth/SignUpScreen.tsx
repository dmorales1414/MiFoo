import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthTextField } from '../../components/auth/AuthTextField';
import { PrimaryButton } from '../../components/Buttons';
import { useAuth } from '../../features/auth/AuthContext';
import {
  displayNameError,
  emailError,
  MAX_DISPLAY_NAME,
  passwordError,
  usernameError,
} from '../../features/auth/validation';
import { styles } from '../../styles/auth/auth.styles';
import { colors } from '../../styles/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false); // show field errors only after the first try
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNotice, setConfirmNotice] = useState(false);

  const errors = {
    displayName: displayNameError(displayName),
    email: emailError(email),
    username: usernameError(username),
    password: passwordError(password),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (touched ? errors[key] : undefined);

  async function submit() {
    if (busy) return;
    setTouched(true);
    if (hasErrors) return;
    setBusy(true);
    setError(null);
    try {
      const signedIn = await signUp({
        email: email.trim(),
        displayName: displayName.trim(),
        username: username.trim(),
        password,
      });
      // Signed in: the route guard moves to Home by itself. Otherwise show the notice below.
      if (!signedIn) setConfirmNotice(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Track your food and waste less of it.</Text>
        </View>

        <View style={styles.form}>
          <AuthTextField
            label="Your Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="First & Last Name"
            maxLength={MAX_DISPLAY_NAME}
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            error={show('displayName')}
            hint="Shown on your profile."
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <AuthTextField
            ref={emailRef}
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            error={show('email')}
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />
          <AuthTextField
            ref={usernameRef}
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            maxLength={30}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username-new"
            error={show('username')}
            hint="Letters, numbers and underscores. You log in with this."
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AuthTextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secret
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="password-new"
            error={show('password')}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error ? (
            <View style={styles.banner} accessibilityLiveRegion="polite">
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}
          {confirmNotice ? (
            <View style={styles.infoBanner} accessibilityLiveRegion="polite">
              <Text style={styles.infoBannerText}>
                Account created! Check your email and tap the confirmation link, then log in.
              </Text>
            </View>
          ) : null}

          <PrimaryButton label="Sign Up" onPress={submit} loading={busy} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already Have An Account?</Text>
          <Link href="/login" replace style={styles.switchLink}>
            Sign In
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
