import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMe, logIn as apiLogIn, signUp as apiSignUp, updateMe as apiUpdateMe } from '../../services/api';
import { clearSession, onSessionChange, restoreSession, setSession } from '../../services/session';
import type { Me, MeUpdate, SignUpInput } from '../../types/auth';

interface AuthValue {
  /** false while the app checks for a saved login at startup (keep the splash screen up). */
  ready: boolean;
  signedIn: boolean;
  me: Me | null;
  /** Returns true if the user is now signed in, false if they must confirm their email first. */
  signUp: (input: SignUpInput) => Promise<boolean>;
  logIn: (identifier: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateMe: (changes: MeUpdate) => Promise<void>;
  reloadMe: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const reloadMe = useCallback(async () => {
    try {
      setMe(await fetchMe());
    } catch {
      // Offline or server down: keep whatever we had. A rejected login is handled by session.ts.
    }
  }, []);

  // Startup: look for a saved login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await restoreSession();
      if (cancelled) return;
      setSignedIn(saved !== null);
      setReady(true);
      if (saved) reloadMe();
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadMe]);

  // session.ts tells us when a login appears or disappears (including when it expires for good).
  useEffect(
    () =>
      onSessionChange((session) => {
        setSignedIn(session !== null);
        if (!session) setMe(null);
      }),
    [],
  );

  const logIn = useCallback(
    async (identifier: string, password: string) => {
      await setSession(await apiLogIn(identifier, password));
      await reloadMe();
    },
    [reloadMe],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const result = await apiSignUp(input);
      if (!result.session) return false;
      await setSession(result.session);
      await reloadMe();
      return true;
    },
    [reloadMe],
  );

  const logOut = useCallback(async () => {
    await clearSession();
  }, []);

  const updateMe = useCallback(async (changes: MeUpdate) => {
    setMe(await apiUpdateMe(changes));
  }, []);

  const value = useMemo(
    () => ({ ready, signedIn, me, signUp, logIn, logOut, updateMe, reloadMe }),
    [ready, signedIn, me, signUp, logIn, logOut, updateMe, reloadMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
