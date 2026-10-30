"""Shared FastAPI dependencies."""
from collections.abc import AsyncIterator, Callable
from uuid import UUID

import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.core.config import get_settings
from app.db.client import get_auth_client_factory
from app.services import auth as auth_service

bearer_scheme = HTTPBearer(auto_error=False, description="The accessToken from POST /auth/login")


async def get_http_client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient() as client:
        yield client


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    make_auth_client: Callable[[], Client] = Depends(get_auth_client_factory),
) -> UUID:
    """WHO is calling? The user the login token (Authorization: Bearer <token>) belongs to.
    Every route that touches personal data depends on this function."""
    if credentials is None:
        raise auth_service.AuthFailure(401, "Please log in.")
    return auth_service.user_id_from_token(
        credentials.credentials, make_auth_client, get_settings().auth_cache_seconds
    )
