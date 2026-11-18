import type { ExpiryStatus, Item } from '../types/item';

// Status thresholds, inferred from the Figma mockup:
// 2 days -> Urgent, 3-4 days -> Use soon, 6-7 days -> Safe.
// Tune these two numbers to change the cutoffs everywhere.
export const URGENT_MAX_DAYS = 2;
export const USE_SOON_MAX_DAYS = 5;

// Produce is tracked by how long it has been STORED, not by a printed date. Used only when a
// produce item has no expiration date. PLACEHOLDER numbers: adjust to your own rules.
export const PRODUCE_USE_SOON_AFTER_DAYS = 5;
export const PRODUCE_URGENT_AFTER_DAYS = 7;

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

// "October 28, 2026"
export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// "7 days until expiration", "Expires today", "Expired 2 days ago"
export function formatUntilExpiration(daysLeft: number): string {
  if (daysLeft > 1) return `${daysLeft} days until expiration`;
  if (daysLeft === 1) return '1 day until expiration';
  if (daysLeft === 0) return 'Expires today';
  const ago = Math.abs(daysLeft);
  return `Expired ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
}

// Whole days since the item was added. Accepts 'YYYY-MM-DD' or a full timestamp
// like '2026-10-21T10:00:00+00:00' (what the backend sends).
export function daysSince(dateAdded: string, today: Date = new Date()): number {
  const added = dateAdded.length === 10 ? parseISODate(dateAdded) : new Date(dateAdded);
  const diff = startOfDay(today).getTime() - startOfDay(added).getTime();
  return Math.round(diff / MS_PER_DAY);
}

// An item's status for display. 'none' = fresh produce with no printed date: it gets a plain
// gray card and no badge, because there is nothing to warn about yet.
export type DisplayStatus = ExpiryStatus | 'none';

// "Expiring in 4 days", "Expiring tomorrow", "Expires today", "Expired 2 days ago"
export function formatExpiringIn(daysLeft: number): string {
  if (daysLeft > 1) return `Expiring in ${daysLeft} days`;
  if (daysLeft === 1) return 'Expiring tomorrow';
  if (daysLeft === 0) return 'Expires today';
  const ago = Math.abs(daysLeft);
  return `Expired ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
}

// "2 Days In", "1 Day In", "Added today": how long produce has been in the kitchen.
export function formatDaysIn(stored: number): string {
  if (stored <= 0) return 'Added today';
  return `${stored} ${stored === 1 ? 'Day' : 'Days'} In`;
}

export interface ItemDisplay {
  status: DisplayStatus;
  subtitle: string; // the line under the name on a card
  // Smaller is more urgent; used to sort lists (expired first, fresh produce last).
  urgency: number;
  // Item Info screen: the middle stat ("Expiring" / "Stored For") and its value.
  statLabel: string;
  statValue: string;
}

// Everything a card needs to show one item: its status color, the line under the name,
// and how urgent it is.
export function getItemDisplay(item: Item, today: Date = new Date()): ItemDisplay {
  if (item.expirationDate) {
    const daysLeft = daysUntil(item.expirationDate, today);
    return {
      status: getExpiryStatus(daysLeft),
      subtitle: formatExpiringIn(daysLeft),
      urgency: daysLeft,
      statLabel: daysLeft < 0 ? 'Expired' : 'Expiring',
      statValue:
        daysLeft < 0
          ? `${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'Day' : 'Days'} Ago`
          : daysLeft === 0
            ? 'Today'
            : `${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'}`,
    };
  }

  // No expiration date (produce only): go by how long it has been stored.
  const stored = Math.max(0, daysSince(item.dateAdded, today));
  const status: DisplayStatus =
    stored >= PRODUCE_URGENT_AFTER_DAYS ? 'urgent' : stored >= PRODUCE_USE_SOON_AFTER_DAYS ? 'useSoon' : 'none';
  return {
    status,
    subtitle: formatDaysIn(stored),
    // Stored produce sorts after anything with a close date, oldest produce first among itself.
    urgency: 1000 - stored,
    statLabel: 'Stored For',
    statValue: `${stored} ${stored === 1 ? 'Day' : 'Days'}`,
  };
}

// Most urgent first. Ties go alphabetically so the order does not jump around.
export function sortByUrgency(items: Item[], today: Date = new Date()): Item[] {
  return items
    .map((item) => ({ item, urgency: getItemDisplay(item, today).urgency }))
    .sort((a, b) => a.urgency - b.urgency || a.item.itemName.localeCompare(b.item.itemName))
    .map(({ item }) => item);
}
