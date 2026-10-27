from typing import Optional

from app.schemas.base import CamelModel


class ProductSuggestion(CamelModel):
    """What Open Food Facts told us about a scanned barcode. This is NOT saved yet:
    the app shows it, the user adds an expiration date, then POSTs an item.
    Open Food Facts has no expiration dates, so those come from OCR or manual entry."""

    barcode: str
    item_name: str
    brand: Optional[str] = None
    quantity_text: Optional[str] = None  # e.g. "400 g" (package size, not a count)
    image_url: Optional[str] = None
    category: str = "packaged"  # anything with a barcode is packaged
