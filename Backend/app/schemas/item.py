from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.base import CamelModel

ItemCategory = Literal["packaged", "produce"]


class ItemBase(CamelModel):
    item_name: str = Field(min_length=1, max_length=200)
    category: ItemCategory
    # Packaged food needs an expiration date. Produce is tracked by how long it
    # has been stored (date_added), so its expiration date may be empty.
    expiration_date: Optional[date] = None
    quantity: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def packaged_needs_expiration(self):
        if self.category == "packaged" and self.expiration_date is None:
            raise ValueError("expirationDate is required for packaged items")
        return self


class ItemCreate(ItemBase):
    """Body of POST /items. The server adds id, user_id and date_added."""


class ItemUpdate(CamelModel):
    """Body of PATCH /items/{id}. Every field optional."""

    item_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[ItemCategory] = None
    expiration_date: Optional[date] = None
    quantity: Optional[int] = Field(default=None, ge=1)


class Item(ItemBase):
    """A row of the `items` table (UML: Item)."""

    id: UUID
    user_id: UUID
    date_added: datetime
