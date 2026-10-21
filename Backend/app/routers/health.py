from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.db.client import get_supabase

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    """Is the API itself running? (No database involved.)"""
    return {"status": "ok"}


@router.get("/db")
def health_db(db: Client = Depends(get_supabase)):
    """Can the backend really reach Supabase with the configured key?
    The client does not check the key when it is created, so we run a tiny query."""
    try:
        db.table("items").select("id").limit(1).execute()
    except Exception as exc:  # noqa: BLE001 - we want to report any failure
        raise HTTPException(
            status_code=503,
            detail=f"Supabase query failed: {type(exc).__name__}: {exc}",
        )
    return {"status": "ok", "database": "connected"}
