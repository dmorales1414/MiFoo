"""Looks up a barcode on Open Food Facts (API v3, the current recommended version)."""
import httpx

from app.core.config import get_settings
from app.schemas.product import ProductSuggestion

# Only ask for what we use. Smaller responses are faster.
FIELDS = "code,product_name,generic_name,brands,quantity,image_front_small_url"
VALID_LENGTHS = (8, 12, 13, 14)  # EAN-8, UPC-A, EAN-13, GTIN-14


class InvalidBarcode(ValueError):
    pass


class ProductNotFound(Exception):
    pass


class OpenFoodFactsError(Exception):
    """Open Food Facts is down, rate limiting us, or sent something unexpected."""


def validate_barcode(barcode: str) -> str:
    """Digits only, a known length, and a correct GTIN check digit.
    The check digit catches most camera misreads before we waste an API call
    (Open Food Facts allows only ~15 product reads per minute per IP address)."""
    code = barcode.strip()
    if not code.isdigit() or len(code) not in VALID_LENGTHS:
        raise InvalidBarcode("Barcode must be 8, 12, 13 or 14 digits.")
    digits = [int(c) for c in code]
    body, check = digits[:-1], digits[-1]
    # Weights 3,1,3,1... counted from the digit next to the check digit.
    total = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(body)))
    if (10 - total % 10) % 10 != check:
        raise InvalidBarcode("Barcode check digit is wrong (probably a misread).")
    return code


def _clean(value) -> str | None:
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return None


async def lookup_barcode(barcode: str, client: httpx.AsyncClient) -> ProductSuggestion:
    code = validate_barcode(barcode)
    settings = get_settings()
    url = f"{settings.off_base_url}/api/v3/product/{code}.json"
    try:
        resp = await client.get(
            url,
            params={"fields": FIELDS},
            headers={"User-Agent": settings.off_user_agent},
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise OpenFoodFactsError(f"Could not reach Open Food Facts: {exc}") from exc

    if resp.status_code == 404:
        raise ProductNotFound(code)
    if resp.status_code != 200:
        raise OpenFoodFactsError(f"Open Food Facts returned HTTP {resp.status_code}.")

    try:
        data = resp.json()
    except ValueError as exc:
        raise OpenFoodFactsError("Open Food Facts sent a non-JSON response.") from exc

    product = data.get("product")
    # v3 says status "success"/"failure"; older v2 used 1/0. Accept both.
    if data.get("status") in ("failure", 0) or not product:
        raise ProductNotFound(code)

    name = _clean(product.get("product_name")) or _clean(product.get("generic_name"))
    brand = _clean((product.get("brands") or "").split(",")[0])
    if name is None and brand is None:
        # Barcode exists but nobody has filled in a name: treat as not found
        # so the app falls back to manual entry.
        raise ProductNotFound(code)

    return ProductSuggestion(
        barcode=code,
        item_name=name or brand,
        brand=brand,
        quantity_text=_clean(product.get("quantity")),
        image_url=_clean(product.get("image_front_small_url")),
    )
