'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadThemeMode, saveThemeMode } from '../../services/themeStorage';
import { setActiveThemeMode, type ThemeMode } from '../../styles/theme';

interface ThemeValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

// Holds the Light / Dark choice. The first launch is Light; after that the saved choice is used.
// Any component that calls useTheme() draws again when the mode changes, and because `colors`
// and the themed styles read the active mode, everything on screen picks up the new colors.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadThemeMode().then((saved) => {
      if (cancelled) return;
      if (saved) setModeState(saved);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Set before the children draw, so their very first frame already has the right colors.
  setActiveThemeMode(mode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveThemeMode(next);
  }, []);

  const value = useMemo(() => ({ mode, isDark: mode === 'dark', setMode }), [mode, setMode]);

  // The splash screen is still showing until the app is ready, so waiting here is invisible.
  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
