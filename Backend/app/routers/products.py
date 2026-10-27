import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.api_deps import get_http_client
from app.schemas.product import ProductSuggestion
from app.services import open_food_facts as off

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/barcode/{barcode}", response_model=ProductSuggestion, response_model_by_alias=True)
async def get_product_by_barcode(barcode: str, client: httpx.AsyncClient = Depends(get_http_client)):
    """Scan result -> product name/brand/image. 404 means 'not in Open Food Facts':
    the app should switch to manual entry."""
    try:
        return await off.lookup_barcode(barcode, client)
    except off.InvalidBarcode as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except off.ProductNotFound:
        raise HTTPException(status_code=404, detail="Product not found in Open Food Facts.")
    except off.OpenFoodFactsError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
