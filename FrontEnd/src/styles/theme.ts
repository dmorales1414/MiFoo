// Design tokens: the single place where colors, spacing and radii live.
// Values were estimated from the Figma screenshot. Open Figma in Dev Mode,
// click each element, and replace these with the exact hex values.

export const colors = {
  background: '#FFFFFF',
  card: '#E4E4E4', // gray panel behind each list of items
  rowBackground: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#5F6368',
  checkboxBorder: '#9CA3AF',
  navIconInactiveBackground: '#F1F1F1',
  primary: '#2563EB', // blue: floating add button, checkboxes, active tab
  onPrimary: '#FFFFFF',
  danger: '#DC2626', // red: remove button
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
  scannerBackground: '#0B0F19',
  textPlaceholder: '#9CA3AF',
} as const;

// One entry per expiry status. Borders, badge fills and badge text all come from here,
// so changing "Use soon" from orange to yellow is a one-line edit.
export const statusColors = {
  safe: { border: '#22A559', badgeBackground: '#DCFCE7', badgeText: '#15803D', dot: '#22A559' },
  useSoon: { border: '#F59E0B', badgeBackground: '#FEF3C7', badgeText: '#B45309', dot: '#F59E0B' },
  urgent: { border: '#DC2626', badgeBackground: '#FEE2E2', badgeText: '#B91C1C', dot: '#DC2626' },
} as const;

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
