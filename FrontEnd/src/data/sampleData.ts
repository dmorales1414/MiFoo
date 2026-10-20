import type { Item, Meal } from '../types/item';
import { toISODate } from '../utils/expiry';

// Temporary data so the screen renders before the backend exists.
// Dates are relative to today, so the badges always match the Figma mockup
// (7, 4, 3, 2, 6 and 3 days left) no matter when you run the app.
function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export const sampleItems: Item[] = [
  { id: '1', itemName: 'Whole Wheat Pasta', category: 'packaged', expirationDate: daysFromNow(7), dateAdded: daysFromNow(-20), quantity: 1 },
  { id: '2', itemName: 'Greek Yogurt', category: 'packaged', expirationDate: daysFromNow(4), dateAdded: daysFromNow(-5), quantity: 2 },
  { id: '3', itemName: 'Chicken Breast', category: 'packaged', expirationDate: daysFromNow(3), dateAdded: daysFromNow(-2), quantity: 1 },
  { id: '4', itemName: 'Baby Spinach', category: 'produce', expirationDate: daysFromNow(2), dateAdded: daysFromNow(-4), quantity: 1 },
  { id: '5', itemName: 'Red Apples', category: 'produce', expirationDate: daysFromNow(6), dateAdded: daysFromNow(-1), quantity: 6 },
  { id: '6', itemName: 'Avocados', category: 'produce', expirationDate: daysFromNow(3), dateAdded: daysFromNow(-3), quantity: 3 },
];

// No images yet: the carousel shows gray placeholders until you add some.
// To use a real photo, put it in assets/images and add:
//   image: require('../../assets/images/mac-and-cheese.jpg')
export const sampleMeals: Meal[] = [
  { id: 'm1', title: 'Recommended Meal' },
  { id: 'm2', title: 'Recommended Meal' },
  { id: 'm3', title: 'Recommended Meal' },
];
