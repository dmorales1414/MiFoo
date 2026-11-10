// Quantities are typed as text ("2", "0.5", "1/2", "1 1/2") and sent as numbers.

export function parseQuantity(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!t) return null;
  let value: number;
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/); // 1 1/2
  const fraction = t.match(/^(\d+)\/(\d+)$/); // 1/2
  if (mixed) {
    if (Number(mixed[3]) === 0) return null;
    value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (fraction) {
    if (Number(fraction[2]) === 0) return null;
    value = Number(fraction[1]) / Number(fraction[2]);
  } else if (/^\d*\.?\d+$/.test(t) || /^\d+\.$/.test(t)) {
    value = Number(t);
  } else {
    return null;
  }
  value = Math.round(value * 100) / 100;
  return value > 0 && value <= 100000 ? value : null;
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔' };

// 2 -> "2", 0.5 -> "½", 1.5 -> "1½", 2.25 -> "2¼", 0.1 -> "0.1"
export function formatQuantity(value: number): string {
  const whole = Math.floor(value);
  const rest = Math.round((value - whole) * 100) / 100;
  if (rest === 0) return String(whole);
  const frac = FRACTIONS[rest.toFixed(2).replace(/0$/, '')];
  if (frac) return whole > 0 ? `${whole}${frac}` : frac;
  return String(Math.round(value * 100) / 100);
}

// Same text in an input box (no fancy fractions, so it can be edited again).
export function quantityToText(value: number): string {
  return String(Math.round(value * 100) / 100);
}
