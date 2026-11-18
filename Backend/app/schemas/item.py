from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.schemas.base import CamelModel

ItemCategory = Literal["packaged", "produce"]
# Where the item is kept. Shown as the Fridge / Freezer / Pantry tabs in the app.
ItemLocation = Literal["fridge", "freezer", "pantry"]


def _clean_classification(value):
    """"  ice   cream " -> "ice cream"; blank -> None (the app shows a fallback label)."""
    if not isinstance(value, str):
        return value
    cleaned = " ".join(value.split())
    return cleaned or None


class ItemBase(CamelModel):
    item_name: str = Field(min_length=1, max_length=200)
    category: ItemCategory
    # Packaged food needs an expiration date. Produce is tracked by how long it
    # has been stored (date_added), so its expiration date may be empty.
    expiration_date: Optional[date] = None
    quantity: int = Field(default=1, ge=1)
    location: ItemLocation = "pantry"
    # What kind of food it is, as the user describes it ("Ice Cream", "Produce", "Dairy").
    # Free text. The app picks `category` from it ("Produce" -> produce).
    classification: Optional[str] = Field(default=None, max_length=60)

    _clean_classification = field_validator("classification", mode="before")(_clean_classification)

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
    location: Optional[ItemLocation] = None
    classification: Optional[str] = Field(default=None, max_length=60)

    _clean_classification = field_validator("classification", mode="before")(_clean_classification)


class RemoveRequest(CamelModel):
    """Body of POST /items/{id}/remove: how many of this item were used up or thrown away."""

    amount: int = Field(ge=1, le=100000)


class Item(ItemBase):
    """A row of the `items` table (UML: Item)."""

    id: UUID
    user_id: UUID
    date_added: datetime


class RemoveResult(CamelModel):
    """`removed` is true when nothing was left and the item was deleted (`item` is then empty)."""

    removed: bool
    item: Optional[Item] = None
