import base64
import binascii
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.base import CamelModel

MAX_PHOTO_BYTES = 5 * 1024 * 1024


def _clean(value):
    return " ".join(value.split()) if isinstance(value, str) else value


# ---- what the app sends ------------------------------------------------------------------
class IngredientIn(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    quantity: float = Field(gt=0, le=100000)
    unit: Optional[str] = Field(default=None, max_length=20)

    _clean_name = field_validator("name", "unit", mode="before")(_clean)

    @field_validator("unit")
    @classmethod
    def empty_unit_is_none(cls, v):
        return v or None

    @field_validator("quantity")
    @classmethod
    def at_most_two_decimals(cls, v):
        v = round(v, 2)  # the database column keeps 2 decimals
        if v <= 0:
            raise ValueError("quantity must be at least 0.01")
        return v


class RecipeIn(CamelModel):
    """Body of POST /recipes and PUT /recipes/{id}. A title, at least one ingredient and
    at least one step are required (the Create recipe screen enforces the same)."""

    title: str = Field(min_length=1, max_length=200)
    ingredients: list[IngredientIn] = Field(min_length=1, max_length=60)
    steps: list[str] = Field(min_length=1, max_length=60)

    _clean_title = field_validator("title", mode="before")(_clean)

    @field_validator("steps", mode="before")
    @classmethod
    def clean_steps(cls, value):
        if not isinstance(value, list):
            return value
        steps = [" ".join(s.split()) for s in value if isinstance(s, str)]
        return [s for s in steps if s]  # blank steps are dropped

    @field_validator("steps")
    @classmethod
    def step_length(cls, value):
        if any(len(s) > 1000 for s in value):
            raise ValueError("A step can be at most 1000 characters.")
        return value


class PhotoUpload(CamelModel):
    image_base64: str = Field(min_length=1)
    content_type: Literal["image/jpeg", "image/png", "image/webp"] = "image/jpeg"

    def decode(self) -> bytes:
        try:
            raw = base64.b64decode(self.image_base64, validate=True)
        except (binascii.Error, ValueError):
            raise ValueError("The photo data is not valid base64.")
        if not raw:
            raise ValueError("The photo is empty.")
        if len(raw) > MAX_PHOTO_BYTES:
            raise ValueError("That photo is too large (5 MB maximum).")
        return raw


class CookItem(CamelModel):
    item_id: UUID
    amount: int = Field(ge=1, le=1000)  # how many of this item were used


class CookRequest(CamelModel):
    """Pantry items to use up when the user says "I cooked this", and how many of each."""

    items: list[CookItem] = Field(max_length=100)


# ---- what the app gets back --------------------------------------------------------------
class PantryMatch(CamelModel):
    id: UUID
    item_name: str
    quantity: int
    expiring_soon: bool


class IngredientOut(CamelModel):
    id: UUID
    name: str
    quantity: float
    unit: Optional[str] = None
    in_pantry: bool = False
    matches: list[PantryMatch] = []


class RecipeSummary(CamelModel):
    """One row of the Meals list / Home carousel."""

    id: UUID
    title: str
    image_url: Optional[str] = None
    created_at: datetime
    ingredient_count: int
    ingredients_owned: int  # how many ingredient lines have a matching item in the pantry
    can_make_now: bool  # every ingredient is in the pantry
    uses_expiring_soon: list[str] = []  # names of pantry items this recipe would use up


class RecipeDetail(RecipeSummary):
    steps: list[str]
    ingredients: list[IngredientOut]


class CookResult(CamelModel):
    updated: int
    removed: int


class IngredientSuggestion(CamelModel):
    name: str
    note: Optional[str] = None
    source: Literal["pantry", "common"]
    default_unit: Optional[str] = None
