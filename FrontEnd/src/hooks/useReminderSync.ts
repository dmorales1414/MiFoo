import { useEffect } from 'react';

import { useAuth } from '../features/auth/AuthContext';
import { syncExpiryReminders } from '../services/notifications';
import type { Item } from '../types/item';

// Keeps the expiration reminders in step with what is stored. Runs after every load, add and
// remove (the list changes), and when the Push Notifications switch changes.
// Skipped for sample data, and until the profile has loaded (it holds the switch).
export function useReminderSync(items: Item[], loaded: boolean, usingSample: boolean) {
  const { me } = useAuth();
  const pushEnabled = me?.pushNotificationsEnabled;
  useEffect(() => {
    if (!loaded || usingSample || pushEnabled === undefined) return;
    syncExpiryReminders(items, pushEnabled);
  }, [items, loaded, usingSample, pushEnabled]);
}
