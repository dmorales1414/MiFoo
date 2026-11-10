from uuid import UUID

from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.api_deps import get_current_user_id
from app.data.ingredients import COMMON_INGREDIENTS
from app.db.client import get_supabase
from app.schemas.recipe import IngredientSuggestion
from app.services.pantry import name_tokens

router = APIRouter(prefix="/ingredients", tags=["ingredients"])

MAX_SUGGESTIONS = 8


def _rank(name: str, query: str) -> int:
    lowered = name.lower()
    if lowered.startswith(query):
        return 0
    if any(word.startswith(query) for word in lowered.split()):
        return 1
    return 2


@router.get("/suggest", response_model=list[IngredientSuggestion], response_model_by_alias=True)
def suggest(
    q: str = Query(min_length=1, max_length=60),
    user_id: UUID = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    """Ingredient ideas for the search box: the user's own pantry items first, then common ones."""
    query = " ".join(q.lower().split())
    if not query:
        return []

    pantry = db.table("items").select("*").eq("user_id", str(user_id)).execute().data
    results: list[tuple[int, int, IngredientSuggestion]] = []
    seen: set[frozenset[str]] = set()

    for item in pantry:
        name = item["item_name"]
        key = name_tokens(name)
        if query in name.lower() and key not in seen:
            seen.add(key)
            results.append(
                (0, _rank(name, query),
                 IngredientSuggestion(name=name, note=f"In your pantry ({item.get('quantity', 1)} left)", source="pantry"))
            )
    for name, note, unit in COMMON_INGREDIENTS:
        key = name_tokens(name)
        if query in name.lower() and key not in seen:
            seen.add(key)
            results.append(
                (1, _rank(name, query),
                 IngredientSuggestion(name=name, note=note or None, source="common", default_unit=unit or None))
            )

    results.sort(key=lambda r: (r[0], r[1], r[2].name.lower()))
    return [r[2] for r in results[:MAX_SUGGESTIONS]]
