import type { ImageSourcePropType } from 'react-native';

// Mirrors the Item class in the UML class diagram.
export type ItemCategory = 'packaged' | 'produce';

export interface Item {
  id: string;
  itemName: string;
  category: ItemCategory;
  // 'YYYY-MM-DD'. null only for produce, which is tracked by how long it has been
  // stored instead (the database requires a date for packaged items).
  expirationDate: string | null;
  // The backend sends a full timestamp ('2026-10-21T10:00:00+00:00'); sample data uses 'YYYY-MM-DD'.
  dateAdded: string;
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

// What the app sends to create an item (POST /items). The server adds id, userId, dateAdded.
export interface NewItem {
  itemName: string;
  category: ItemCategory;
  expirationDate: string | null;
  quantity: number;
}
