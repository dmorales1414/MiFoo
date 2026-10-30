"""Accounts: sign up, log in, refresh, and checking who a login token belongs to.

The app never talks to Supabase Auth directly. It talks to our backend, which talks to
Supabase. That lets users log in with a USERNAME (Supabase itself only knows emails).
"""
import time
from collections.abc import Callable
from typing import Optional
from uuid import UUID

from supabase import Client
from supabase_auth.errors import AuthError
from supabase_auth.types import Session

from app.schemas.auth import LoginRequest, SessionOut, SignUpRequest

BAD_LOGIN = "Incorrect username or password."
EXPIRED = "Your login has expired. Please log in again."


class AuthFailure(Exception):
    """An expected problem (wrong password, username taken...). main.py turns it into a JSON error."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# ---- helpers ------------------------------------------------------------------------------
def escape_like(value: str) -> str:
    """Make a username safe to use in a case-insensitive 'equals' (ilike).
    In LIKE patterns, _ and % are wildcards; usernames may contain _."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def username_taken(db: Client, username: str, exclude_id: Optional[UUID] = None) -> bool:
    query = db.table("profiles").select("id").ilike("username", escape_like(username))
    if exclude_id is not None:
        query = query.neq("id", str(exclude_id))
    return bool(query.limit(1).execute().data)


def find_email_for_username(db: Client, username: str) -> Optional[str]:
    rows = db.table("profiles").select("id").ilike("username", escape_like(username)).limit(1).execute().data
    if not rows:
        return None
    private = db.table("profile_private").select("email").eq("id", rows[0]["id"]).limit(1).execute().data
    return private[0].get("email") if private else None


def to_session_out(session: Session) -> SessionOut:
    expires_at = session.expires_at or int(time.time()) + int(session.expires_in or 3600)
    return SessionOut(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_at=expires_at,
    )


def _status(exc: AuthError) -> Optional[int]:
    return getattr(exc, "status", None)


def _code(exc: AuthError) -> Optional[str]:
    return getattr(exc, "code", None)


# ---- sign up / log in / refresh ----------------------------------------------------------
def sign_up(db: Client, make_auth_client: Callable[[], Client], data: SignUpRequest) -> Optional[SessionOut]:
    """Create the account. Returns the session, or None when email confirmation is required."""
    if username_taken(db, data.username):
        raise AuthFailure(409, "That username is already taken.")

    client = make_auth_client()
    try:
        result = client.auth.sign_up(
            {
                "email": data.email,
                "password": data.password,
                # Read by the database trigger (sql/schema.sql) to build the profile row.
                "options": {"data": {"username": data.username, "display_name": data.display_name}},
            }
        )
    except AuthError as exc:
        code, status = _code(exc), _status(exc)
        if code in ("user_already_exists", "email_exists"):
            raise AuthFailure(409, "An account with this email already exists.")
        if code == "weak_password":
            raise AuthFailure(400, "That password is too weak. Try a longer one.")
        if status == 429 or (code or "").endswith("rate_limit"):
            raise AuthFailure(429, "Too many attempts. Please wait a few minutes and try again.")
        if status is not None and status >= 500:
            raise AuthFailure(
                500,
                "The account could not be created. The username may have just been taken, "
                "or the database schema is out of date (re-run backend/sql/schema.sql).",
            )
        raise AuthFailure(400, getattr(exc, "message", None) or "Could not create the account.")

    # With email confirmation ON, Supabase hides "this email exists" by returning a user
    # that has no identities. Report it instead of pretending the signup worked.
    user = result.user
    if user is not None and user.identities is not None and len(user.identities) == 0:
        raise AuthFailure(409, "An account with this email already exists.")

    return to_session_out(result.session) if result.session else None


def log_in(db: Client, make_auth_client: Callable[[], Client], data: LoginRequest) -> SessionOut:
    identifier = data.identifier
    email = identifier.lower() if "@" in identifier else find_email_for_username(db, identifier)
    if not email:
        # Same message as a wrong password, so nobody can use this to discover usernames.
        raise AuthFailure(401, BAD_LOGIN)

    client = make_auth_client()
    try:
        result = client.auth.sign_in_with_password({"email": email, "password": data.password})
    except AuthError as exc:
        code, status = _code(exc), _status(exc)
        if code == "email_not_confirmed":
            raise AuthFailure(403, "Please confirm your email address first (check your inbox).")
        if status == 429 or (code or "").endswith("rate_limit"):
            raise AuthFailure(429, "Too many attempts. Please wait a minute and try again.")
        raise AuthFailure(401, BAD_LOGIN)
    if not result.session:
        raise AuthFailure(401, BAD_LOGIN)
    return to_session_out(result.session)


def refresh(make_auth_client: Callable[[], Client], refresh_token: str) -> SessionOut:
    client = make_auth_client()
    try:
        result = client.auth.refresh_session(refresh_token)
    except AuthError:
        raise AuthFailure(401, EXPIRED)
    if not result.session:
        raise AuthFailure(401, EXPIRED)
    return to_session_out(result.session)


# ---- who is calling? ----------------------------------------------------------------------
# Asking Supabase "is this token valid?" on every request would be slow, so a verified token
# is remembered for a short time (settings.auth_cache_seconds).
_token_cache: dict[str, tuple[UUID, float]] = {}


def clear_token_cache() -> None:
    _token_cache.clear()


def user_id_from_token(token: str, make_auth_client: Callable[[], Client], cache_seconds: int) -> UUID:
    now = time.monotonic()
    hit = _token_cache.get(token)
    if hit and hit[1] > now:
        return hit[0]

    client = make_auth_client()
    try:
        result = client.auth.get_user(token)
    except AuthError:
        raise AuthFailure(401, EXPIRED)
    if result is None or result.user is None:
        raise AuthFailure(401, EXPIRED)

    user_id = UUID(str(result.user.id))
    if len(_token_cache) > 2000:
        _token_cache.clear()
    _token_cache[token] = (user_id, now + cache_seconds)
    return user_id
