from collections.abc import Callable
from functools import lru_cache

from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase() -> Client:
    """One shared client for database work. Uses the SECRET key (skips row-level security),
    so every query must filter by user itself."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_secret_key)


def new_auth_client() -> Client:
    """A brand-new client for ONE sign-up / log-in / token check, using the PUBLISHABLE key.

    Never reuse one: signing in changes a client's login state, and a shared client
    would then run database queries as that user instead of as the backend."""
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


def get_auth_client_factory() -> Callable[[], Client]:
    """FastAPI dependency (so tests can swap in a fake)."""
    return new_auth_client
