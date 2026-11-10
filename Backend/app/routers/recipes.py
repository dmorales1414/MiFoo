from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from postgrest.exceptions import APIError
from supabase import Client

from app.api_deps import get_current_user_id
from app.db.client import get_supabase
from app.schemas.recipe import (
    CookRequest,
    CookResult,
    PhotoUpload,
    RecipeDetail,
    RecipeIn,
    RecipeSummary,
)
from app.services import pantry

router = APIRouter(prefix="/recipes", tags=["recipes"])

BUCKET = "recipe-photos"
EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

# The backend uses the secret key, which BYPASSES row-level security. So every query below
# MUST filter on the signed-in user (recipes.user_id, items.user_id). Do not remove them.


def _db_error(exc: APIError) -> HTTPException:
    return HTTPException(status_code=400, detail=f"Database rejected the request: {exc.message}")


def _today():
    return datetime.now(timezone.utc).date()


# ---- loading ------------------------------------------------------------------------------
def _own_recipe(db: Client, user_id: UUID, recipe_id: UUID) -> dict:
    rows = db.table("recipes").select("*").eq("id", str(recipe_id)).eq("user_id", str(user_id)).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Meal not found.")
    return rows[0]


def _ingredient_rows(db: Client, recipe_ids: list[str]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {rid: [] for rid in recipe_ids}
    if recipe_ids:
        rows = db.table("recipe_ingredients").select("*").in_("recipe_id", recipe_ids).order("position").execute().data
        for row in rows:
            grouped.setdefault(str(row["recipe_id"]), []).append(row)
    return grouped


def _pantry_items(db: Client, user_id: UUID) -> list[dict]:
    return db.table("items").select("*").eq("user_id", str(user_id)).execute().data


def _detail(db: Client, user_id: UUID, recipe: dict) -> dict:
    annotated = pantry.annotate(
        recipe, _ingredient_rows(db, [str(recipe["id"])])[str(recipe["id"])], _pantry_items(db, user_id), _today()
    )
    annotated["steps"] = list(recipe.get("steps") or [])
    return annotated


# ---- list / read --------------------------------------------------------------------------
@router.get("", response_model=list[RecipeSummary], response_model_by_alias=True)
def list_recipes(user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    """The user's meals, best suggestion first (uses food that is about to expire)."""
    recipes = db.table("recipes").select("*").eq("user_id", str(user_id)).execute().data
    ingredients = _ingredient_rows(db, [str(r["id"]) for r in recipes])
    items = _pantry_items(db, user_id)
    today = _today()
    summaries = [pantry.annotate(r, ingredients[str(r["id"])], items, today) for r in recipes]
    return pantry.recommended_order(summaries)


@router.get("/{recipe_id}", response_model=RecipeDetail, response_model_by_alias=True)
def get_recipe(recipe_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    return _detail(db, user_id, _own_recipe(db, user_id, recipe_id))


# ---- create / replace / delete ------------------------------------------------------------
def _ingredient_payload(recipe_id: str, body: RecipeIn) -> list[dict]:
    return [
        {"recipe_id": recipe_id, "name": ing.name, "quantity": ing.quantity, "unit": ing.unit, "position": i}
        for i, ing in enumerate(body.ingredients)
    ]


@router.post("", response_model=RecipeDetail, response_model_by_alias=True, status_code=201)
def create_recipe(body: RecipeIn, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    try:
        recipe = db.table("recipes").insert(
            {"user_id": str(user_id), "title": body.title, "steps": body.steps}
        ).execute().data[0]
    except APIError as exc:
        raise _db_error(exc)
    try:
        db.table("recipe_ingredients").insert(_ingredient_payload(str(recipe["id"]), body)).execute()
    except APIError as exc:
        db.table("recipes").delete().eq("id", str(recipe["id"])).eq("user_id", str(user_id)).execute()  # undo
        raise _db_error(exc)
    return _detail(db, user_id, recipe)


@router.put("/{recipe_id}", response_model=RecipeDetail, response_model_by_alias=True)
def replace_recipe(
    recipe_id: UUID, body: RecipeIn, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)
):
    _own_recipe(db, user_id, recipe_id)
    old_ids = [str(r["id"]) for r in _ingredient_rows(db, [str(recipe_id)])[str(recipe_id)]]
    try:
        # Add the new ingredient rows FIRST, then remove the old ones, so a failure in the
        # middle can never leave the recipe with no ingredients.
        db.table("recipe_ingredients").insert(_ingredient_payload(str(recipe_id), body)).execute()
        if old_ids:
            db.table("recipe_ingredients").delete().in_("id", old_ids).execute()
        recipe = db.table("recipes").update(
            {"title": body.title, "steps": body.steps, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", str(recipe_id)).eq("user_id", str(user_id)).execute().data[0]
    except APIError as exc:
        raise _db_error(exc)
    return _detail(db, user_id, recipe)


def _storage_path(url: Optional[str]) -> Optional[str]:
    marker = f"/{BUCKET}/"
    return url.split(marker, 1)[1].split("?")[0] if url and marker in url else None


def _remove_photo_file(db: Client, url: Optional[str]) -> None:
    path = _storage_path(url)
    if path:
        try:
            db.storage.from_(BUCKET).remove([path])
        except Exception:  # an orphaned file is harmless; never block the user over it
            pass


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    old_url = _own_recipe(db, user_id, recipe_id).get("image_url")
    db.table("recipes").delete().eq("id", str(recipe_id)).eq("user_id", str(user_id)).execute()
    _remove_photo_file(db, old_url)
    return Response(status_code=204)


# ---- photo --------------------------------------------------------------------------------
@router.put("/{recipe_id}/photo", response_model=RecipeDetail, response_model_by_alias=True)
def set_photo(
    recipe_id: UUID, body: PhotoUpload, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)
):
    old_url = _own_recipe(db, user_id, recipe_id).get("image_url")
    try:
        data = body.decode()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    path = f"{user_id}/{recipe_id}-{uuid4().hex[:8]}.{EXTENSIONS[body.content_type]}"
    try:
        db.storage.from_(BUCKET).upload(path, data, {"content-type": body.content_type})
        url = db.storage.from_(BUCKET).get_public_url(path)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Could not store the photo. Did you run backend/sql/schema.sql? It creates the recipe-photos bucket.",
        )
    updated = db.table("recipes").update({"image_url": url}).eq("id", str(recipe_id)).eq("user_id", str(user_id)).execute().data[0]
    _remove_photo_file(db, old_url)
    return _detail(db, user_id, updated)


@router.delete("/{recipe_id}/photo", response_model=RecipeDetail, response_model_by_alias=True)
def remove_photo(recipe_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    old_url = _own_recipe(db, user_id, recipe_id).get("image_url")
    updated = db.table("recipes").update({"image_url": None}).eq("id", str(recipe_id)).eq("user_id", str(user_id)).execute().data[0]
    _remove_photo_file(db, old_url)
    return _detail(db, user_id, updated)


# ---- "I cooked this" ----------------------------------------------------------------------
@router.post("/{recipe_id}/cook", response_model=CookResult, response_model_by_alias=True)
def cook(
    recipe_id: UUID, body: CookRequest, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)
):
    """Uses up pantry items: each chosen item loses the amount used, and is removed when none is left.
    Only items that match one of this recipe's ingredients are accepted."""
    detail = _detail(db, user_id, _own_recipe(db, user_id, recipe_id))
    allowed = {str(m["id"]) for ing in detail["ingredients"] for m in ing["matches"]}

    wanted: dict[str, int] = {}
    for use in body.items:
        key = str(use.item_id)
        if key in allowed:
            wanted[key] = wanted.get(key, 0) + use.amount  # the same item listed twice adds up
    if not wanted:
        return CookResult(updated=0, removed=0)

    items = db.table("items").select("*").eq("user_id", str(user_id)).in_("id", list(wanted)).execute().data
    updated = removed = 0
    try:
        for item in items:
            left = item["quantity"] - wanted[str(item["id"])]
            if left <= 0:  # used all of it (or asked for more than there is)
                db.table("items").delete().eq("id", item["id"]).eq("user_id", str(user_id)).execute()
                removed += 1
            else:
                db.table("items").update({"quantity": left}).eq("id", item["id"]).eq("user_id", str(user_id)).execute()
                updated += 1
    except APIError as exc:
        raise _db_error(exc)
    return CookResult(updated=updated, removed=removed)
