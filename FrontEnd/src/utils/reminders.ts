import type { Item } from '../types/item';
import { PRODUCE_USE_SOON_AFTER_DAYS, parseISODate, toISODate } from './expiry';

// WHEN and WHAT the app reminds you about. Pure functions (no phone features), so the rules
// are easy to read, change and test. services/notifications.ts schedules what this returns.

export const REMINDER_HOUR = 9; // reminders arrive at 9:00 AM local time
export const DAYS_BEFORE = [3, 1, 0] as const; // heads-up 3 days before, tomorrow, and the day itself
export const MAX_SCHEDULED = 60; // phones limit how many can wait at once (iOS: 64)
const MAX_NAMES_SHOWN = 3;

type Kind = 'd3' | 'd1' | 'd0' | 'produce';

export interface PlannedReminder {
  key: string;
  at: Date;
  title: string;
  body: string;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(day: Date, n: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + n);
}
function at9(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), REMINDER_HOUR, 0, 0);
}
// 'YYYY-MM-DD' or a full timestamp -> that calendar day in local time (null if unreadable).
function localDay(value: string): Date | null {
  const t = (value ?? '').trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return parseISODate(t);
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function nameList(names: string[]): string {
  const shown = names.slice(0, MAX_NAMES_SHOWN).join(', ');
  const extra = names.length - MAX_NAMES_SHOWN;
  return extra > 0 ? `${shown} and ${extra} more` : shown;
}

function message(kind: Kind, names: string[]): { title: string; body: string } {
  const one = names.length === 1;
  const list = nameList(names);
  switch (kind) {
    case 'd3':
      return { title: 'Use soon', body: `${list} ${one ? 'expires' : 'expire'} in 3 days.` };
    case 'd1':
      return { title: 'Expires tomorrow', body: `${list} ${one ? 'expires' : 'expire'} tomorrow.` };
    case 'd0':
      return { title: 'Expires today', body: `${list} ${one ? 'expires' : 'expire'} today.` };
    case 'produce':
      return {
        title: 'Check your produce',
        body: `${list} ${one ? 'has' : 'have'} been stored for ${PRODUCE_USE_SOON_AFTER_DAYS} days.`,
      };
  }
}

// Items on the same day get ONE notification ("Milk, Eggs and 2 more expire tomorrow"),
// not one each. Reminders whose time has already passed are skipped.
export function planReminders(items: Item[], now: Date = new Date()): PlannedReminder[] {
  const groups = new Map<string, { kind: Kind; at: Date; names: Set<string> }>();

  const add = (kind: Kind, day: Date, name: string) => {
    const at = at9(day);
    if (at.getTime() <= now.getTime()) return;
    const key = `${kind}|${toISODate(day)}`;
    const group = groups.get(key) ?? { kind, at, names: new Set<string>() };
    group.names.add(name);
    groups.set(key, group);
  };

  for (const item of items) {
    if (item.expirationDate) {
      const expires = localDay(item.expirationDate);
      if (!expires) continue;
      for (const days of DAYS_BEFORE) add(`d${days}` as Kind, addDays(expires, -days), item.itemName);
    } else if (item.category === 'produce') {
      // Produce without a printed date is judged by how long it has been stored.
      const added = localDay(item.dateAdded);
      if (added) add('produce', addDays(added, PRODUCE_USE_SOON_AFTER_DAYS), item.itemName);
    }
  }

  return [...groups.entries()]
    .map(([key, g]) => ({ key, at: g.at, ...message(g.kind, [...g.names]) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}
