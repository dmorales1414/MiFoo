// Units offered in the ingredient dropdown. null = no unit ("3 eggs").
export const UNITS: { value: string | null; label: string }[] = [
  { value: null, label: 'whole' },
  { value: 'tsp', label: 'tsp' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'cup', label: 'cup' },
  { value: 'fl oz', label: 'fl oz' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'cloves', label: 'cloves' },
  { value: 'slice', label: 'slice' },
  { value: 'can', label: 'can' },
  { value: 'bunch', label: 'bunch' },
  { value: 'pinch', label: 'pinch' },
];

export function unitLabel(unit: string | null): string {
  return unit ?? 'whole';
}

// Catalog entries say "whole" where the recipe unit is none.
export function normalizeUnit(unit: string | null | undefined): string | null {
  if (!unit || unit === 'whole') return null;
  return UNITS.some((u) => u.value === unit) ? unit : unit;
}
