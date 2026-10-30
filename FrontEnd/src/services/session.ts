// The login session (access token + refresh token) used by api.ts.
//
// - accessToken: sent with every request. Expires after about an hour.
// - refreshToken: trades for a new accessToken without asking for the password again.
import type { Session } from '../types/auth';
import { clearStoredSession, loadStoredSession, saveStoredSession } from './tokenStorage';

type Refresher = (refreshToken: string) => Promise<Session>;
type Listener = (session: Session | null) => void;

let current: Session | null = null;
let refresher: Refresher | null = null;
let inFlight: Promise<Session | null> | null = null;
const listeners = new Set<Listener>();

const EARLY_SECONDS = 30; // refresh a little before the token really expires

function notify() {
  listeners.forEach((l) => l(current));
}

export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRefresher(fn: Refresher) {
  refresher = fn;
}

export async function restoreSession(): Promise<Session | null> {
  current = await loadStoredSession();
  return current;
}

export async function setSession(session: Session): Promise<void> {
  current = session;
  await saveStoredSession(session);
  notify();
}

export async function clearSession(): Promise<void> {
  current = null;
  await clearStoredSession();
  notify();
}

export function hasSession(): boolean {
  return current !== null;
}

// Gets a new session using the refresh token. Several requests failing at once share ONE
// refresh call (a refresh token can only be used once).
export function refreshSession(): Promise<Session | null> {
  if (!current || !refresher) return Promise.resolve(null);
  if (inFlight) return inFlight;
  const token = current.refreshToken;
  inFlight = (async () => {
    try {
      const next = await refresher!(token);
      await setSession(next);
      return next;
    } catch (error) {
      // Only a rejected refresh token means "logged out". A network error should not log anyone out.
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 400 || status === 403) await clearSession();
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// The token to send right now, refreshing first if it is about to expire.
export async function getAccessToken(): Promise<string | null> {
  if (!current) return null;
  if (current.expiresAt - Date.now() / 1000 < EARLY_SECONDS) {
    const next = await refreshSession();
    return next?.accessToken ?? current?.accessToken ?? null;
  }
  return current.accessToken;
}
