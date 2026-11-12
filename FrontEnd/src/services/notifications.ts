// Expiration reminders, shown by the phone itself ("local notifications").
//
// They are scheduled ON the phone from your item list, so no server, Firebase or Expo push
// service is involved. The plan (what and when) is in utils/reminders.ts. We cancel everything
// and schedule again whenever the item list or the Push Notifications switch changes.
//
// expo-notifications is a native module: until the app is rebuilt with it (`eas build`), the
// require() below fails and every function here quietly does nothing (status 'unavailable').
import { Platform } from 'react-native';

import type { Item } from '../types/item';
import { planReminders } from '../utils/reminders';
import { fetchItems } from './api';

const CHANNEL_ID = 'expiry';

interface PermissionResult {
  granted: boolean;
  canAskAgain?: boolean;
}
interface NotificationsModule {
  setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
  setNotificationChannelAsync(id: string, channel: { name: string; importance: number }): Promise<unknown>;
  getPermissionsAsync(): Promise<PermissionResult>;
  requestPermissionsAsync(): Promise<PermissionResult>;
  scheduleNotificationAsync(request: {
    content: { title: string; body: string; data?: object };
    trigger: object;
  }): Promise<string>;
  cancelAllScheduledNotificationsAsync(): Promise<void>;
  AndroidImportance: { HIGH: number };
  SchedulableTriggerInputTypes: { DATE: string };
}

let N: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-notifications') as NotificationsModule;
  if (typeof mod?.scheduleNotificationAsync === 'function') {
    N = mod;
    // Without a handler, a notification that arrives while the app is OPEN is not shown at all.
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
} catch {
  N = null;
}

export function isNotificationsAvailable(): boolean {
  return N !== null;
}

export type SyncStatus = 'ok' | 'disabled' | 'denied' | 'unavailable';
export interface SyncResult {
  status: SyncStatus;
  scheduled: number;
}

// Two syncs running at once could schedule everything twice, so they wait in line.
let queue: Promise<unknown> = Promise.resolve();
function inLine<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

// Android 13+ needs the channel to exist BEFORE asking for permission.
async function ensureChannel(n: NotificationsModule) {
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync(CHANNEL_ID, { name: 'Expiration reminders', importance: n.AndroidImportance.HIGH });
  }
}

// true = allowed. Asks the user only if the phone still lets us ask.
async function ensurePermission(n: NotificationsModule, mayAsk: boolean): Promise<boolean> {
  const current = await n.getPermissionsAsync();
  if (current.granted) return true;
  if (!mayAsk || current.canAskAgain === false) return false;
  return (await n.requestPermissionsAsync()).granted;
}

// Used by the Push Notifications switch: show the permission pop-up when turning it on.
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'unavailable'> {
  const n = N;
  if (!n) return 'unavailable';
  try {
    await ensureChannel(n);
    return (await ensurePermission(n, true)) ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

// Replaces every scheduled reminder with the right ones for these items.
export function syncExpiryReminders(items: Item[], enabled: boolean): Promise<SyncResult> {
  return inLine<SyncResult>(async () => {
    const n = N;
    if (!n) return { status: 'unavailable', scheduled: 0 };
    try {
      await n.cancelAllScheduledNotificationsAsync();
      if (!enabled) return { status: 'disabled', scheduled: 0 };

      await ensureChannel(n);
      if (!(await ensurePermission(n, true))) return { status: 'denied', scheduled: 0 };

      const plan = planReminders(items);
      for (const reminder of plan) {
        await n.scheduleNotificationAsync({
          content: { title: reminder.title, body: reminder.body, data: { kind: 'expiry' } },
          trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: CHANNEL_ID },
        });
      }
      return { status: 'ok', scheduled: plan.length };
    } catch {
      return { status: 'unavailable', scheduled: 0 };
    }
  });
}

// For screens that do not have the items loaded (the Profile switch).
export async function syncRemindersFromServer(enabled: boolean): Promise<SyncResult> {
  if (!enabled) return syncExpiryReminders([], false);
  try {
    return await syncExpiryReminders(await fetchItems(), true);
  } catch {
    return { status: 'unavailable', scheduled: 0 }; // offline: keep what is already scheduled
  }
}

// Logging out: nobody else should get this account's reminders.
export function cancelReminders(): Promise<SyncResult> {
  return syncExpiryReminders([], false);
}

// "Send a test notification" button: arrives in 5 seconds so you can check the whole setup.
export async function sendTestNotification(): Promise<'sent' | 'denied' | 'unavailable'> {
  const n = N;
  if (!n) return 'unavailable';
  try {
    await ensureChannel(n);
    if (!(await ensurePermission(n, true))) return 'denied';
    await n.scheduleNotificationAsync({
      content: { title: 'MiFoo test', body: 'Expiration reminders are working.' },
      trigger: {
        type: n.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 5000),
        channelId: CHANNEL_ID,
      },
    });
    return 'sent';
  } catch {
    return 'unavailable';
  }
}
