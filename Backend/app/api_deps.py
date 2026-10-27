"""Shared FastAPI dependencies."""
from collections.abc import AsyncIterator
from uuid import UUID

import httpx
from fastapi import HTTPException

from app.core.config import get_settings


async def get_http_client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient() as client:
        yield client


def get_current_user_id() -> UUID:
    """WHO is calling? TEMPORARY: always the user in DEV_USER_ID.
    When login is built, replace the body of this one function so it reads the
    Supabase access token from the Authorization header and returns that user's id.
    Every route already depends on it, so nothing else has to change."""
    raw = get_settings().dev_user_id
    if not raw:
        raise HTTPException(
            status_code=500,
            detail="DEV_USER_ID is not set in backend/.env (see .env.example).",
        )
    try:
        return UUID(raw)
    except ValueError:
        raise HTTPException(status_code=500, detail="DEV_USER_ID is not a valid UUID.")
