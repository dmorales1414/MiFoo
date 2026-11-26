// Remembers whether the person picked Light or Dark, so it survives closing the app.
// Uses the same phone storage as the login tokens (expo-secure-store). If that native module
// is missing from the installed build, the choice is kept in memory only and resets next launch.
import type { ThemeMode } from '../styles/theme';

const KEY = 'mifoo.theme';

interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

let store: SecureStoreLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-secure-store') as SecureStoreLike;
  if (typeof mod?.getItemAsync === 'function') store = mod;
} catch {
  store = null;
}

let memory: ThemeMode | null = null;

export async function loadThemeMode(): Promise<ThemeMode | null> {
  if (!store) return memory;
  try {
    const raw = await store.getItemAsync(KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  memory = mode;
  try {
    await store?.setItemAsync(KEY, mode);
  } catch {
    // The in-memory copy keeps this run working.
  }
}
