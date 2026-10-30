import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthTextField } from '../components/auth/AuthTextField';
import { BottomNavBar } from '../components/BottomNavBar';
import { PrimaryButton, TextLink } from '../components/Buttons';
import { useAuth } from '../features/auth/AuthContext';
import { displayNameError, MAX_DISPLAY_NAME, phoneError, usernameError } from '../features/auth/validation';
import { styles } from '../styles/profileScreen.styles';
import { colors, layout, spacing } from '../styles/theme';
import type { Me } from '../types/auth';

function initialsOf(name: string | null, fallback: string | null): string {
  const source = (name || fallback || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

function joinedText(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `Joined ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : <Text style={styles.rowEmpty}>Not set</Text>}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { me, reloadMe, updateMe, logOut } = useAuth();
  const insets = useSafeAreaInsets();
  const navBottom = insets.bottom + layout.navBarBottomGap;

  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // If the profile was not loaded yet (slow start or offline), try again when the screen opens.
  useEffect(() => {
    if (!me) reloadMe();
  }, [me, reloadMe]);

  async function togglePush(value: boolean) {
    setNotice(null);
    try {
      await updateMe({ pushNotificationsEnabled: value });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not save that setting.');
    }
  }

  function confirmLogOut() {
    Alert.alert('Log out?', 'You will need to log in again to see your items.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: navBottom + layout.navBarHeight + spacing.xxl },
        ]}
      >
        <View style={styles.hero}>
          {me?.avatarUrl ? (
            <Image source={{ uri: me.avatarUrl }} style={styles.avatar} accessibilityLabel="Profile picture" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initialsOf(me?.displayName ?? null, me?.username ?? null)}</Text>
            </View>
          )}
          <Text style={styles.name}>{me?.displayName || me?.username || ' '}</Text>
          {me ? <Text style={styles.joined}>{joinedText(me.createdAt)}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>General</Text>
            {me ? (
              <Pressable
                onPress={() => setEditing(true)}
                style={styles.editButton}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editLabel}>Edit</Text>
              </Pressable>
            ) : null}
          </View>
          <InfoRow icon="person-outline" label="Username" value={me?.username ?? null} />
          <InfoRow icon="mail-outline" label="Email" value={me?.email ?? null} />
          <InfoRow icon="call-outline" label="Phone" value={me?.phone ?? null} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowValue}>Push Notifications</Text>
              <Text style={styles.rowLabel}>Get reminded before food expires</Text>
            </View>
            <Switch
              value={me?.pushNotificationsEnabled ?? true}
              onValueChange={togglePush}
              disabled={!me}
              trackColor={{ true: colors.primary, false: colors.checkboxBorder }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Push notifications"
            />
          </View>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Pressable onPress={confirmLogOut} style={styles.logout} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={colors.onDanger} />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <BottomNavBar activeTab="profile" bottomOffset={navBottom} />

      {me ? <EditProfileSheet visible={editing} me={me} onClose={() => setEditing(false)} /> : null}
    </View>
  );
}

// ---- Edit sheet: display name, username, phone -------------------------------------------
function EditProfileSheet({ visible, me, onClose }: { visible: boolean; me: Me; onClose: () => void }) {
  const { updateMe } = useAuth();
  const [displayName, setDisplayName] = useState(me.displayName ?? '');
  const [username, setUsername] = useState(me.username ?? '');
  const [phone, setPhone] = useState(me.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Start from the saved values every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setDisplayName(me.displayName ?? '');
      setUsername(me.username ?? '');
      setPhone(me.phone ?? '');
      setError(null);
      setTouched(false);
    }
  }, [visible, me]);

  const errors = {
    displayName: displayNameError(displayName),
    username: usernameError(username),
    phone: phoneError(phone),
  };

  async function save() {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    // Send only what changed.
    const changes: Parameters<typeof updateMe>[0] = {};
    if (displayName.trim() !== (me.displayName ?? '')) changes.displayName = displayName.trim();
    if (username.trim() !== (me.username ?? '')) changes.username = username.trim();
    if (phone.trim() !== (me.phone ?? '')) changes.phone = phone.trim();
    if (Object.keys(changes).length === 0) return onClose();

    setBusy(true);
    setError(null);
    try {
      await updateMe(changes);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Edit profile</Text>
            <AuthTextField
              label="Name"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={MAX_DISPLAY_NAME}
              autoCapitalize="words"
              error={touched ? errors.displayName : undefined}
            />
            <AuthTextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              maxLength={30}
              autoCapitalize="none"
              autoCorrect={false}
              error={touched ? errors.username : undefined}
            />
            <AuthTextField
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={20}
              placeholder="(555) 123-4567"
              error={touched ? errors.phone : undefined}
            />
            {error ? <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text> : null}
            <View style={styles.sheetButtons}>
              <PrimaryButton label="Save" onPress={save} loading={busy} />
              <TextLink label="Cancel" onPress={onClose} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
