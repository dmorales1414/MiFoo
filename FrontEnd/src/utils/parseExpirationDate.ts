// Finds an expiration date inside the messy text that OCR (reading text from a camera
// picture) returns, e.g. "LOT 4471\nBEST BEFORE 28 OCT 2026\nPKD 14 SEP 26".
//
// Pure function with no React or camera code, so it is easy to test and to tweak.
// Returns null when no believable date is found; the screen then waits for the next frame.

import { toISODate } from './expiry';

export interface ParsedDate {
  iso: string; // 'YYYY-MM-DD'
  matchedText: string; // the piece of text it came from (handy for debugging)
}

export interface ParseOptions {
  today?: Date; // injectable so tests do not depend on the real date
  dayFirst?: boolean; // true = read 05/06/26 as 5 June. Default false (US style: May 6).
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const MONTH_RE =
  '(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)';

// Words printed next to an expiration date, and next to dates we must NOT pick.
const GOOD_WORDS = /(BEST\s*(?:BY|BEFORE|IF\s*USED\s*BY)|BB[DE]?|EXP(?:IRES|IRY|IRATION)?|USE\s*(?:BY|BEFORE)|SELL\s*BY|BEFORE|ENJOY\s*BY|FRESH\s*UNTIL)\W*(?:END\W*)?(?:DATE\W*)?$/;
const BAD_WORDS = /(PROD(?:UCED|UCTION)?|MFG|MFD|MANUF(?:ACTURED)?|PACK(?:ED|AGED)?|PKD|PKG|BORN|BOTTLED|ROAST(?:ED)?|PRINTED)\W*(?:ON\W*)?(?:DATE\W*)?$/;

const MAX_YEARS_AHEAD = 15;
const MAX_DAYS_PAST = 366;

interface Candidate {
  date: Date;
  start: number;
  matchedText: string;
  needsKeyword?: boolean; // year-less dates are only trusted next to an "EXP" style word
}

// OCR often reads 0 as O and 1 as I or L inside numbers (the text is already upper-case here) ("1O/28/2O26"). Fix those, but
// only inside tokens that already look like numbers, so ordinary words are untouched.
function fixDigitLookalikes(text: string): string {
  return text.replace(/[0-9OIL][0-9OIL/.\-]{4,}[0-9OIL]/g, (token) => {
    if ((token.match(/[0-9]/g) ?? []).length < 4) return token;
    return token.replace(/O/g, '0').replace(/[IL]/g, '1');
  });
}

function makeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  // Rejects things like Feb 30 (JavaScript would silently roll it to March 2).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function fullYear(raw: string): number {
  const n = Number(raw);
  return raw.length === 2 ? 2000 + n : n;
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0); // day 0 of next month = last day of this month
}

// Blank out a matched piece so a later, looser pattern cannot match inside it again.
function blank(text: string, start: number, length: number): string {
  return text.slice(0, start) + ' '.repeat(length) + text.slice(start + length);
}

export function parseExpirationDate(rawText: string, options: ParseOptions = {}): ParsedDate | null {
  const today = options.today ?? new Date();
  const dayFirst = options.dayFirst ?? false;
  const original = rawText.toUpperCase().replace(/[\r\n]+/g, ' \n ');
  const numeric = fixDigitLookalikes(original);

  const candidates: Candidate[] = [];
  const add = (date: Date | null, start: number, matchedText: string, needsKeyword = false) => {
    if (date) candidates.push({ date, start, matchedText: matchedText.trim(), needsKeyword });
  };

  // Each pattern runs on a working copy; matches are blanked so patterns do not overlap.
  const run = (source: string, re: RegExp, handle: (m: RegExpExecArray) => void): string => {
    let work = source;
    for (const m of source.matchAll(re)) {
      handle(m as RegExpExecArray);
      work = blank(work, m.index ?? 0, m[0].length);
    }
    return work;
  };

  // --- Patterns that contain a month NAME (run on the original text) ---------------
  let named = original;
  // 28 OCT 2026 / 28OCT26 / 28-OCT-2026
  named = run(named, new RegExp(`(\\d{1,2})\\s*[-/. ]?\\s*${MONTH_RE}[A-Z]*\\s*[-/. ,]*\\s*(\\d{4}|\\d{2})(?!\\d)`, 'g'), (m) =>
    add(makeDate(fullYear(m[3]), MONTHS[m[2].slice(0, 3)], Number(m[1])), m.index ?? 0, m[0]));
  // OCT 28, 2026 / OCT 28 26 / OCTOBER 28TH 2026
  named = run(named, new RegExp(`${MONTH_RE}[A-Z]*\\s*[-/. ]?\\s*(\\d{1,2})(?:ST|ND|RD|TH)?\\s*[,.\\-/ ]\\s*(\\d{4}|\\d{2})(?!\\d)`, 'g'), (m) =>
    add(makeDate(fullYear(m[3]), MONTHS[m[1].slice(0, 3)], Number(m[2])), m.index ?? 0, m[0]));
  // OCT 2026 -> treated as the last day of that month
  named = run(named, new RegExp(`${MONTH_RE}[A-Z]*\\s*[-/. ,]*\\s*(\\d{4})(?!\\d)`, 'g'), (m) => {
    const year = Number(m[2]);
    add(lastDayOfMonth(year, MONTHS[m[1].slice(0, 3)]), m.index ?? 0, m[0]);
  });

  // --- Numeric patterns (run on the digit-corrected text) --------------------------
  let nums = numeric;
  // 20261028 and 2026-10-28 / 2026/10/28
  nums = run(nums, /(?:^|\D)(20\d{2})(\d{2})(\d{2})(?!\d)/g, (m) =>
    add(makeDate(Number(m[1]), Number(m[2]), Number(m[3])), m.index ?? 0, m[0]));
  nums = run(nums, /(?:^|\D)(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})(?!\d)/g, (m) =>
    add(makeDate(Number(m[1]), Number(m[2]), Number(m[3])), m.index ?? 0, m[0]));
  // 10/28/2026, 28.10.26, 05-06-26 (see "dayFirst" above for the ambiguous ones)
  nums = run(nums, /(?:^|\D)(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4}|\d{2})(?!\d)/g, (m) => {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = fullYear(m[3]);
    let day: number;
    let month: number;
    if (a > 12) { day = a; month = b; }          // 28/10/26 can only be day-first
    else if (b > 12) { month = a; day = b; }     // 10/28/26 can only be month-first
    else if (dayFirst) { day = a; month = b; }
    else { month = a; day = b; }
    add(makeDate(year, month, day), m.index ?? 0, m[0]);
  });
  // 10/2026 (month and year only) -> last day of that month
  nums = run(nums, /(?:^|\D)(\d{1,2})\s*[-/.]\s*(\d{4})(?!\d)/g, (m) => {
    const month = Number(m[1]);
    if (month >= 1 && month <= 12) add(lastDayOfMonth(Number(m[2]), month), m.index ?? 0, m[0]);
  });

  // --- Dates with no year ("BEST BY OCT 28"): trusted only next to an EXP-style word ---
  named = run(named, new RegExp(`(\\d{1,2})\\s*[-/. ]?\\s*${MONTH_RE}(?![A-Z])`, 'g'), (m) =>
    add(nextOccurrence(MONTHS[m[2].slice(0, 3)], Number(m[1]), today), m.index ?? 0, m[0], true));
  run(named, new RegExp(`${MONTH_RE}[A-Z]*\\s*[-/. ]?\\s*(\\d{1,2})(?:ST|ND|RD|TH)?(?!\\d)`, 'g'), (m) =>
    add(nextOccurrence(MONTHS[m[1].slice(0, 3)], Number(m[2]), today), m.index ?? 0, m[0], true));

  // --- Choose the best candidate -----------------------------------------------------
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - MAX_DAYS_PAST);
  const latest = new Date(today.getFullYear() + MAX_YEARS_AHEAD, today.getMonth(), today.getDate());

  let best: { c: Candidate; score: number } | null = null;
  for (const c of candidates) {
    if (c.date < earliest || c.date > latest) continue;

    // Look at the text just before the date for words like "BEST BEFORE" or "PKD".
    const before = original.slice(Math.max(0, c.start - 30), c.start).replace(/\s+/g, ' ');
    let score = 0;
    if (GOOD_WORDS.test(before)) score += 2;
    if (BAD_WORDS.test(before)) score -= 3;
    if (c.needsKeyword && score < 2) continue;

    // Tie-break: a package prints its packed date and its expiration date;
    // the later one is the expiration.
    if (!best || score > best.score || (score === best.score && c.date > best.c.date)) {
      best = { c, score };
    }
  }

  return best ? { iso: toISODate(best.c.date), matchedText: best.c.matchedText } : null;
}

// "OCT 28" with no year: the next time that calendar day comes around.
function nextOccurrence(month: number, day: number, today: Date): Date | null {
  const thisYear = makeDate(today.getFullYear(), month, day);
  if (!thisYear) return null;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return thisYear >= startOfToday ? thisYear : makeDate(today.getFullYear() + 1, month, day);
}
