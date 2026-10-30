from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError
from supabase import Client

from app.api_deps import get_current_user_id
from app.db.client import get_supabase
from app.schemas.profile import Me, MeUpdate
from app.services.auth import username_taken

router = APIRouter(prefix="/me", tags=["me"])

# Public details live in `profiles`, private ones in `profile_private` (see sql/schema.sql).
PUBLIC_FIELDS = {"username", "display_name", "avatar_url"}
PRIVATE_FIELDS = {"phone", "push_notifications_enabled"}


def _first(db: Client, table: str, user_id: UUID):
    rows = db.table(table).select("*").eq("id", str(user_id)).limit(1).execute().data
    return rows[0] if rows else None


def _load_me(db: Client, user_id: UUID) -> Me:
    profile = _first(db, "profiles", user_id)
    private = _first(db, "profile_private", user_id)
    if profile is None:
        # Accounts made before the trigger existed. Build the missing row on first use.
        profile = db.table("profiles").insert({"id": str(user_id)}).execute().data[0]
    if private is None:
        private = db.table("profile_private").insert({"id": str(user_id)}).execute().data[0]
    return Me(
        id=user_id,
        email=private.get("email"),
        username=profile.get("username"),
        display_name=profile.get("display_name"),
        avatar_url=profile.get("avatar_url"),
        phone=private.get("phone"),
        push_notifications_enabled=private.get("push_notifications_enabled", True),
        created_at=profile["created_at"],
    )


@router.get("", response_model=Me, response_model_by_alias=True)
def get_me(user_id: UUID = Depends(get_current_user_id), db: Client = Depends(get_supabase)):
    return _load_me(db, user_id)


@router.patch("", response_model=Me, response_model_by_alias=True)
def update_me(
    body: MeUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    if changes.get("push_notifications_enabled", True) is None:
        raise HTTPException(status_code=400, detail="pushNotificationsEnabled must be true or false.")

    _load_me(db, user_id)  # makes sure both rows exist

    new_username = changes.get("username")
    if new_username and username_taken(db, new_username, exclude_id=user_id):
        raise HTTPException(status_code=409, detail="That username is already taken.")

    public = {k: v for k, v in changes.items() if k in PUBLIC_FIELDS}
    private = {k: v for k, v in changes.items() if k in PRIVATE_FIELDS}
    try:
        if public:
            db.table("profiles").update(public).eq("id", str(user_id)).execute()
        if private:
            db.table("profile_private").update(private).eq("id", str(user_id)).execute()
    except APIError as exc:
        if getattr(exc, "code", None) == "23505":  # two people raced for the same username
            raise HTTPException(status_code=409, detail="That username is already taken.")
        raise HTTPException(status_code=400, detail=f"Database rejected the request: {exc.message}")

    return _load_me(db, user_id)
