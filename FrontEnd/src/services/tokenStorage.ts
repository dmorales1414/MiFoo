// Keeps the login tokens on the phone, in its secure storage (Android Keystore / iOS Keychain).
//
// expo-secure-store is a native module: until the app is rebuilt with it (`eas build`),
// the require() below fails and we fall back to memory. Everything still works, you just
// have to log in again each time the app is fully closed.
import type { Session } from '../types/auth';

const KEY = 'mifoo.session';

interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

let store: SecureStoreLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-secure-store') as SecureStoreLike;
  if (typeof mod?.getItemAsync === 'function') store = mod;
} catch {
  store = null;
}

let memory: Session | null = null;

export async function loadStoredSession(): Promise<Session | null> {
  if (!store) return memory;
  try {
    const raw = await store.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed?.accessToken && parsed?.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveStoredSession(session: Session): Promise<void> {
  memory = session;
  try {
    await store?.setItemAsync(KEY, JSON.stringify(session));
  } catch {
    // Secure storage failed: the in-memory copy keeps this run working.
  }
}

export async function clearStoredSession(): Promise<void> {
  memory = null;
  try {
    await store?.deleteItemAsync(KEY);
  } catch {
    // Nothing more to do.
  }
}
