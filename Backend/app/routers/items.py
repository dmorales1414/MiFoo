from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from postgrest.exceptions import APIError
from supabase import Client

from app.api_deps import get_current_user_id
from app.db.client import get_supabase
from app.db.retry import run
from app.schemas.item import Item, ItemCreate, ItemUpdate, RemoveRequest, RemoveResult

router = APIRouter(prefix="/items", tags=["items"])

# The backend uses the secret key, which BYPASSES row-level security. So every
# query below MUST filter on user_id itself. Do not remove those .eq() calls.


def _db_error(exc: APIError) -> HTTPException:
    return HTTPException(status_code=400, detail=f"Database rejected the request: {exc.message}")


@router.get("", response_model=list[Item], response_model_by_alias=True)
def list_items(user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    res = run(
        db.table("items").select("*").eq("user_id", str(user_id))
        .order("expiration_date", desc=False, nullsfirst=False)
    )
    return res.data


def _own_item(db: Client, user_id: UUID, item_id: UUID) -> dict:
    res = run(db.table("items").select("*").eq("id", str(item_id)).eq("user_id", str(user_id)))
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found.")
    return res.data[0]


@router.get("/{item_id}", response_model=Item, response_model_by_alias=True)
def get_item(item_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    return _own_item(db, user_id, item_id)


@router.post("", response_model=Item, response_model_by_alias=True, status_code=201)
def create_item(body: ItemCreate, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    row = body.model_dump(mode="json")  # snake_case keys, dates as ISO strings
    row["user_id"] = str(user_id)
    try:
        res = db.table("items").insert(row).execute()
    except APIError as exc:
        raise _db_error(exc)
    return res.data[0]


@router.patch("/{item_id}", response_model=Item, response_model_by_alias=True)
def update_item(item_id: UUID, body: ItemUpdate, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    changes = body.model_dump(mode="json", exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No fields to update.")
    try:
        res = db.table("items").update(changes).eq("id", str(item_id)).eq("user_id", str(user_id)).execute()
    except APIError as exc:
        raise _db_error(exc)
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found.")
    return res.data[0]


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    res = db.table("items").delete().eq("id", str(item_id)).eq("user_id", str(user_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Item not found.")
    return Response(status_code=204)


@router.post("/{item_id}/remove", response_model=RemoveResult, response_model_by_alias=True)
def remove_amount(
    item_id: UUID,
    body: RemoveRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    """Use up part of an item. Takes `amount` off the quantity; when nothing is left the item
    is deleted. Asking for more than is stored just removes the item."""
    item = _own_item(db, user_id, item_id)
    left = int(item.get("quantity", 1)) - body.amount
    if left <= 0:
        run(db.table("items").delete().eq("id", str(item_id)).eq("user_id", str(user_id)))
        return {"removed": True, "item": None}
    try:
        res = run(db.table("items").update({"quantity": left}).eq("id", str(item_id)).eq("user_id", str(user_id)))
    except APIError as exc:
        raise _db_error(exc)
    return {"removed": False, "item": res.data[0]}
