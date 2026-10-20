import type { ExpiryStatus } from '../types/item';

// Status thresholds, inferred from the Figma mockup:
// 2 days -> Urgent, 3-4 days -> Use soon, 6-7 days -> Safe.
// Tune these two numbers to change the cutoffs everywhere.
export const URGENT_MAX_DAYS = 2;
export const USE_SOON_MAX_DAYS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// IMPORTANT: new Date('2026-10-21') is parsed as UTC midnight, which shows up as
// Oct 20 in US time zones. Building the date from its parts keeps it in local time.
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole calendar days from today until the given date (negative if already past).
export function daysUntil(iso: string, today: Date = new Date()): number {
  const diff = parseISODate(iso).getTime() - startOfDay(today).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export function getExpiryStatus(daysLeft: number): ExpiryStatus {
  if (daysLeft <= URGENT_MAX_DAYS) return 'urgent';
  if (daysLeft <= USE_SOON_MAX_DAYS) return 'useSoon';
  return 'safe';
}

export const STATUS_LABELS: Record<ExpiryStatus, string> = {
  safe: 'Safe',
  useSoon: 'Use soon',
  urgent: 'Urgent',
};

// "Oct 21, 2026"
export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// "7 days left", "1 day left", "Expires today", "Expired 2 days ago"
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  if (daysLeft === 0) return 'Expires today';
  const ago = Math.abs(daysLeft);
  return `Expired ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
}
