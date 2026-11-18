import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { ItemLocation } from '../../types/item';

type IconName = ComponentProps<typeof Ionicons>['name'];

// The three places food can be kept. Order here is the order of the buttons and tabs.
export const LOCATIONS: { key: ItemLocation; label: string; icon: IconName }[] = [
  { key: 'fridge', label: 'Fridge', icon: 'thermometer-outline' },
  { key: 'freezer', label: 'Freezer', icon: 'snow-outline' },
  { key: 'pantry', label: 'Pantry', icon: 'archive-outline' },
];

export const LOCATION_LABELS: Record<ItemLocation, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  pantry: 'Pantry',
};

// The tab row on Home and Pantry: everything, or one place.
export type LocationFilter = 'all' | ItemLocation;
export const LOCATION_TABS: { key: LocationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...LOCATIONS.map(({ key, label }) => ({ key, label })),
];
