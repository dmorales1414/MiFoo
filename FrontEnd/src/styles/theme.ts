// Design tokens: the single place where colors, spacing and radii live.
// Values were estimated from the Figma screenshot. Open Figma in Dev Mode,
// click each element, and replace these with the exact hex values.

// ---- Light and dark palettes ----------------------------------------------------------------
// Every screen reads colors through `colors` and `statusColors` below. They always return the
// palette of the mode that is currently active, so switching the mode in Profile re-colors the app.
// To tweak the dark look, edit the `darkColors` / `darkStatusColors` blocks. Nothing else needs to change.

export type ThemeMode = 'light' | 'dark';

const lightColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF', // sheets, pop-up menus, navigation bar
  card: '#E4E4E4', // gray panel behind each list of items
  rowBackground: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#5F6368',
  checkboxBorder: '#9CA3AF',
  navIconInactiveBackground: '#F1F1F1',
  primary: '#2563EB', // blue: floating add button, checkboxes, active tab
  primaryText: '#2563EB', // blue text and icons on the screen (links, selected labels)
  onPrimary: '#FFFFFF',
  danger: '#DC2626', // red: fills (remove / log out buttons)
  dangerText: '#DC2626', // red: text and icons sitting on the screen
  onDanger: '#FFFFFF',
  chipBackground: '#FFFFFF',
  navBackground: '#FFFFFF',
  navInactive: '#6B7280',
  overlay: 'rgba(0, 0, 0, 0.12)',
  popoverIconBackground: '#E0E7FF',
  placeholderImage: '#D1D5DB',
  // Added for the add-item flow:
  primarySoft: '#EEF4FF', // light blue info cards
  primaryBorder: '#C7D8FB',
  primaryMuted: '#C9D9F8', // unfilled step-progress segments
  primaryDisabled: '#9DB8F0', // primary button while disabled
  field: '#F3F4F6', // input background
  border: '#E5E7EB',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  successSoftText: '#15803D',
  warningSoft: '#FEF3C7', // yellow notice banners
  warningSoftText: '#92400E',
  dangerSoft: '#FEE2E2', // red error banners
  dangerSoftText: '#B91C1C',
  scannerBackground: '#0B0F19',
  textPlaceholder: '#9CA3AF',
  switchThumb: '#FFFFFF',
  swatchLight: '#FFFFFF', // the two squares in Profile > Theme Modes
  swatchDark: '#2B2B2B',
};

export type Palette = { [K in keyof typeof lightColors]: string };

// Dark mode: the page is the Figma dark gray (#494949); sheets, inputs and cards are a step
// lighter so they stand out; text is near-white.
const darkColors: Palette = {
  background: '#494949',
  surface: '#525252',
  card: '#525252',
  rowBackground: '#525252',
  textPrimary: '#F5F5F5',
  textSecondary: '#E0E0E0',
  checkboxBorder: '#A8A8A8',
  navIconInactiveBackground: '#6A6A6A',
  primary: '#3769E0', // a touch deeper than the Figma #4781FE so white text on it stays readable
  primaryText: '#BAD1FF',
  onPrimary: '#FFFFFF',
  danger: '#C23A3B',
  dangerText: '#FFB3B3',
  onDanger: '#FFFFFF',
  chipBackground: '#525252',
  navBackground: '#525252',
  navInactive: '#D0D0D0',
  overlay: 'rgba(0, 0, 0, 0.3)',
  popoverIconBackground: '#3C4D78',
  placeholderImage: '#6B6B6B',
  primarySoft: '#2F3C5C',
  primaryBorder: '#5877BA',
  primaryMuted: '#5E6F99',
  primaryDisabled: '#3F5A98',
  field: '#606060',
  border: '#707070',
  success: '#A0F3C0',
  successSoft: '#1F4D33',
  successSoftText: '#86EFAC',
  warningSoft: '#5E4C1E',
  warningSoftText: '#FCD34D',
  dangerSoft: '#5E2B2D',
  dangerSoftText: '#FCA5A5',
  scannerBackground: '#0B0F19',
  textPlaceholder: '#DADADA',
  switchThumb: '#FFFFFF',
  swatchLight: '#FFFFFF',
  swatchDark: '#2B2B2B',
};

// One entry per expiry status. Borders, badge fills and badge text all come from here,
// so changing "Use soon" from orange to yellow is a one-line edit.
//   rowBackground: the card behind the item   metaText: "Expiring in 2 days" under the name
const lightStatusColors = {
  safe: { border: '#22A559', rowBackground: '#FFFFFF', badgeBackground: '#DCFCE7', badgeText: '#15803D', metaText: '#15803D', dot: '#22A559' },
  useSoon: { border: '#F59E0B', rowBackground: '#FFFFFF', badgeBackground: '#FEF3C7', badgeText: '#B45309', metaText: '#B45309', dot: '#F59E0B' },
  urgent: { border: '#DC2626', rowBackground: '#FFFFFF', badgeBackground: '#FEE2E2', badgeText: '#B91C1C', metaText: '#B91C1C', dot: '#DC2626' },
  // Fresh produce with no printed date: a plain gray card, no badge.
  none: { border: '#D1D5DB', rowBackground: '#FFFFFF', badgeBackground: '#F3F4F6', badgeText: '#6B7280', metaText: '#5F6368', dot: '#9CA3AF' },
};

type StatusPalette = typeof lightStatusColors;

// Dark mode keeps the light badge pills from the Figma frames; the card behind each item is tinted.
const darkStatusColors: StatusPalette = {
  safe: { border: '#4CC37F', rowBackground: '#3F5A4A', badgeBackground: '#DCFCE7', badgeText: '#15803D', metaText: '#8FE8B3', dot: '#22A559' },
  useSoon: { border: '#F5A524', rowBackground: '#5E5238', badgeBackground: '#FEF3C7', badgeText: '#B45309', metaText: '#F8C46B', dot: '#F59E0B' },
  urgent: { border: '#EF5B5B', rowBackground: '#5E4244', badgeBackground: '#FEE2E2', badgeText: '#B91C1C', metaText: '#FFB4B4', dot: '#DC2626' },
  none: { border: '#9A9A9A', rowBackground: '#565656', badgeBackground: '#F3F4F6', badgeText: '#6B7280', metaText: '#D9D9D9', dot: '#9CA3AF' },
};

// The mode that is active right now. ThemeProvider (features/theme/ThemeContext.tsx) sets it.
let currentMode: ThemeMode = 'light';

export function getThemeMode(): ThemeMode {
  return currentMode;
}

export function setActiveThemeMode(mode: ThemeMode): void {
  currentMode = mode;
}

// `colors.primary` and `statusColors.safe.border` always read from the active palette.
export const colors: Palette = new Proxy({} as Palette, {
  get: (_target, key: string) => (currentMode === 'dark' ? darkColors : lightColors)[key as keyof Palette],
});

export const statusColors: StatusPalette = new Proxy({} as StatusPalette, {
  get: (_target, key: string) => (currentMode === 'dark' ? darkStatusColors : lightStatusColors)[key as keyof StatusPalette],
});

// Wraps a StyleSheet so its colors follow the active mode. The styles are built the first time
// they are used in each mode, then reused:  export const styles = themedStyles(() => StyleSheet.create({...}))
export function themedStyles<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ThemeMode, T>> = {};
  return new Proxy({} as T, {
    get: (_target, key) => {
      const built = (cache[currentMode] ??= factory());
      return built[key as keyof T];
    },
  });
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6, // Android uses elevation instead of the shadow* props
  },
} as const;

// Heights used to keep scrolling content clear of the floating controls.
export const layout = {
  navBarHeight: 72,
  navBarBottomGap: 12,
  fabSize: 68,
} as const;
