from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import CamelModel


class RecipeBase(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    source_url: Optional[str] = None


class RecipeCreate(RecipeBase):
    pass


class Recipe(RecipeBase):
    """A row of the `recipes` table (UML: Recipe)."""

    id: UUID


class RecipeIngredientBase(CamelModel):
    recipe_id: UUID
    item_id: UUID
    quantity: int = Field(default=1, ge=1)


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredient(RecipeIngredientBase):
    """A row of `recipe_ingredients` (UML: RecipeIngredient, joins Recipe -> Item)."""

    id: UUID
