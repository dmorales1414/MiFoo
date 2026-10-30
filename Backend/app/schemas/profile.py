from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field, field_validator

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


PHONE_PATTERN = r"^[0-9+()\-.\s]{7,20}$"


class Me(CamelModel):
    """The signed-in user's own account: public profile + private details.
    Only the user themself can get this (GET /me)."""

    id: UUID
    email: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    push_notifications_enabled: bool = True
    created_at: datetime


class MeUpdate(CamelModel):
    """Body of PATCH /me. Send only what changes. Send phone as null or "" to clear it."""

    username: Optional[str] = Field(default=None, pattern=r"^[A-Za-z0-9_]{3,30}$")
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    avatar_url: Optional[str] = Field(default=None, max_length=2000)
    phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)
    push_notifications_enabled: Optional[bool] = None

    @field_validator("username", "display_name", "avatar_url", "phone", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def empty_phone_clears(cls, value):
        # "" means "remove my phone number"; the pattern check must not reject it.
        return None if isinstance(value, str) and value.strip() == "" else value
