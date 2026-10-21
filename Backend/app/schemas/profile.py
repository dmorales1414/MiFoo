from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import CamelModel


class ProfileUpdate(CamelModel):
    """Body of PATCH /profile. Every field optional."""

    username: Optional[str] = Field(default=None, pattern=r"^[A-Za-z0-9_]{3,30}$")
    display_name: Optional[str] = Field(default=None, max_length=60)
    avatar_url: Optional[str] = None


class Profile(CamelModel):
    """A row of `profiles`. Same id as the user's auth account. No email on purpose."""

    id: UUID
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
