from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase() -> Client:
    """One shared Supabase client for the whole backend (uses the SECRET key)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_secret_key)
