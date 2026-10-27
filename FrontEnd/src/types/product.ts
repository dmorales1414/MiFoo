// What the backend's GET /products/barcode/{code} returns (Open Food Facts data).
// This is a suggestion only. It is NOT saved until the user adds an expiration date
// and the app sends POST /items.
export interface ProductSuggestion {
  barcode: string;
  itemName: string;
  brand: string | null;
  quantityText: string | null; // package size such as "500 g", not an item count
  imageUrl: string | null;
  category: 'packaged';
}
