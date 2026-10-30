from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found no matter which folder uvicorn is started from.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    # Used ONLY for sign-up / log-in calls (it is the key meant for client-style access).
    # Supabase dashboard -> Project Settings -> API Keys -> "Publishable key" (sb_publishable_...)
    supabase_publishable_key: str

    # Open Food Facts asks every app to send a descriptive User-Agent:
    # "AppName/Version (contact email)".
    off_user_agent: str = "MiFoo/0.1 (Neumont capstone; contact: you@example.com)"
    off_base_url: str = "https://world.openfoodfacts.org"

    # How long a verified login token is remembered, to avoid asking Supabase on every request.
    auth_cache_seconds: int = 60

    # Read values from backend/.env. "ignore" lets old lines (DEV_USER_ID...) stay in the file.
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()