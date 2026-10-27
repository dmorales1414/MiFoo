from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found no matter which folder uvicorn is started from.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str

    # Open Food Facts asks every app to send a descriptive User-Agent:
    # "AppName/Version (contact email)".
    off_user_agent: str = "MiFoo/0.1 (Neumont capstone; contact: you@example.com)"
    off_base_url: str = "https://world.openfoodfacts.org"

    # TEMPORARY until login exists: the id of one user from Supabase
    # (Authentication -> Users). All items are saved under this user.
    dev_user_id: str | None = None

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
