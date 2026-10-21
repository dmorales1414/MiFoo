from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas import Item, ItemCreate, ItemUpdate, Recipe, RecipeIngredient


def test_item_create_accepts_camelcase_json():
    item = ItemCreate.model_validate(
        {"itemName": "Milk", "category": "packaged", "expirationDate": "2026-10-30", "quantity": 2}
    )
    assert item.item_name == "Milk"
    assert item.expiration_date == date(2026, 10, 30)


def test_item_create_accepts_snake_case_in_python():
    assert ItemCreate(item_name="Milk", category="packaged", expiration_date=date(2026, 10, 30)).quantity == 1


def test_packaged_requires_expiration():
    with pytest.raises(ValidationError):
        ItemCreate(item_name="Milk", category="packaged")


def test_produce_may_skip_expiration():
    assert ItemCreate(item_name="Apple", category="produce").expiration_date is None


def test_bad_category_and_quantity():
    with pytest.raises(ValidationError):
        ItemCreate(item_name="X", category="frozen", expiration_date=date.today())
    with pytest.raises(ValidationError):
        ItemCreate(item_name="X", category="produce", quantity=0)


def test_item_from_database_row_serializes_to_camelcase():
    row = {
        "id": str(uuid4()), "user_id": str(uuid4()), "item_name": "Spinach",
        "category": "produce", "expiration_date": None,
        "date_added": "2026-10-21T10:00:00+00:00", "quantity": 1,
    }
    out = Item.model_validate(row).model_dump(mode="json", by_alias=True)
    assert set(out) == {"id", "userId", "itemName", "category", "expirationDate", "dateAdded", "quantity"}


def test_update_is_partial():
    assert ItemUpdate.model_validate({"quantity": 3}).model_dump(exclude_unset=True) == {"quantity": 3}


def test_recipe_and_ingredient():
    r = Recipe.model_validate({"id": str(uuid4()), "title": "Soup", "sourceUrl": "https://x.test"})
    assert r.source_url == "https://x.test"
    RecipeIngredient.model_validate({"id": str(uuid4()), "recipeId": str(uuid4()), "itemId": str(uuid4())})


def test_profile_has_no_email_and_validates_username():
    from app.schemas import Profile, ProfileUpdate

    p = Profile.model_validate({"id": str(uuid4()), "created_at": "2026-10-21T10:00:00+00:00"})
    assert "email" not in p.model_dump()
    assert p.model_dump(mode="json", by_alias=True)["displayName"] is None
    with pytest.raises(ValidationError):
        ProfileUpdate(username="a!")
