import type { ImageSourcePropType } from 'react-native';

// Mirrors the Item class in the UML class diagram.
export type ItemCategory = 'packaged' | 'produce';

export interface Item {
  id: string;
  itemName: string;
  category: ItemCategory;
  expirationDate: string; // 'YYYY-MM-DD'
  dateAdded: string; // 'YYYY-MM-DD'
  quantity: number;
}

export type ExpiryStatus = 'safe' | 'useSoon' | 'urgent';

// Shape of one card in the "Recommended Meal" carousel.
// The meal recommendation algorithm's results will be mapped into this later.
export interface Meal {
  id: string;
  title: string;
  image?: ImageSourcePropType; // optional so the UI renders before you have real photos
}
