from typing import Optional

from pydantic import Field, field_validator

from app.schemas.base import CamelModel

# The same username rule the database enforces (backend/sql/schema.sql).
USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,30}$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 72  # the limit of the password hashing Supabase uses


def _strip(value):
    return value.strip() if isinstance(value, str) else value


class SignUpRequest(CamelModel):
    email: str = Field(max_length=254, pattern=EMAIL_PATTERN)
    display_name: str = Field(min_length=1, max_length=60)
    username: str = Field(pattern=USERNAME_PATTERN)
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)

    _strip_fields = field_validator("email", "display_name", "username", mode="before")(_strip)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class LoginRequest(CamelModel):
    # Either the username or the email address.
    identifier: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=200)

    _strip_identifier = field_validator("identifier", mode="before")(_strip)


class RefreshRequest(CamelModel):
    refresh_token: str = Field(min_length=1, max_length=4000)


class SessionOut(CamelModel):
    """Login tokens. The app sends access_token with every request and uses
    refresh_token to get a new access_token when it expires (usually after an hour)."""

    access_token: str
    refresh_token: str
    expires_at: int  # seconds since 1970


class AuthResult(CamelModel):
    session: Optional[SessionOut] = None
    # True when the Supabase project requires email confirmation: the account exists,
    # but there is no session until the user clicks the link in their email.
    needs_email_confirmation: bool = False
