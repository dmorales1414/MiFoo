from uuid import UUID

from app.schemas.base import CamelModel


class User(CamelModel):
    """UML: User. Supabase Auth owns the account (auth.users), including the
    password, so there is no passwordHash field here."""

    id: UUID
    email: str
