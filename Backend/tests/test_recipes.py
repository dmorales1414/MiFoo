import base64
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.db.client import get_auth_client_factory, get_supabase
from app.main import app
from app.services import auth as auth_service
from tests.fakes import FakeAuth, FakeAuthClient, FakeDB
from tests.test_auth import SIGNUP, bearer, signup

SOON = (date.today() + timedelta(days=2)).isoformat()
LATER = (date.today() + timedelta(days=60)).isoformat()

PASTA = {
    "title": "Garlic Pasta",
    "ingredients": [
        {"name": "spaghetti", "quantity": 8, "unit": "oz"},
        {"name": "garlic", "quantity": 3, "unit": "cloves"},
        {"name": "olive oil", "quantity": 2, "unit": "tbsp"},
    ],
    "steps": ["Boil the pasta.", "Fry the garlic.", "Toss together."],
}


@pytest.fixture
def world():
    db = FakeDB()
    fake = FakeAuth(db)
    auth_service.clear_token_cache()
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_auth_client_factory] = lambda: (lambda: FakeAuthClient(fake))
    c = TestClient(app)
    h = bearer(signup(c))
    yield c, db, h
    app.dependency_overrides.clear()


def add_item(c, h, name, days=SOON, qty=1, category="packaged"):
    r = c.post("/items", headers=h, json={"itemName": name, "category": category, "expirationDate": days, "quantity": qty})
    assert r.status_code == 201, r.text
    return r.json()


def test_create_and_read_recipe(world):
    c, db, h = world
    r = c.post("/recipes", headers=h, json=PASTA)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["title"] == "Garlic Pasta" and body["steps"][1] == "Fry the garlic."
    assert [i["name"] for i in body["ingredients"]] == ["spaghetti", "garlic", "olive oil"]
    assert body["ingredientCount"] == 3 and body["ingredientsOwned"] == 0 and body["canMakeNow"] is False
    assert c.get(f"/recipes/{body['id']}", headers=h).json()["title"] == "Garlic Pasta"
    assert len(c.get("/recipes", headers=h).json()) == 1


@pytest.mark.parametrize("patch", [{"ingredients": []}, {"steps": ["  "]}, {"title": " "}])
def test_create_requires_all_parts(world, patch):
    c, _, h = world
    assert c.post("/recipes", headers=h, json={**PASTA, **patch}).status_code == 422


def test_requires_login(world):
    c, _, _ = world
    assert c.get("/recipes").status_code == 401
    assert c.post("/recipes", json=PASTA).status_code == 401
    assert c.get("/ingredients/suggest?q=le").status_code == 401


def test_pantry_matching_and_expiring(world):
    c, _, h = world
    add_item(c, h, "Spaghetti", LATER)
    add_item(c, h, "Garlic", SOON)
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    d = c.get(f"/recipes/{rid}", headers=h).json()
    assert d["ingredientsOwned"] == 2 and d["canMakeNow"] is False
    assert d["usesExpiringSoon"] == ["Garlic"]
    by_name = {i["name"]: i for i in d["ingredients"]}
    assert by_name["garlic"]["inPantry"] and by_name["garlic"]["matches"][0]["expiringSoon"]
    assert not by_name["olive oil"]["inPantry"]
    add_item(c, h, "Olive Oil", LATER)
    assert c.get(f"/recipes/{rid}", headers=h).json()["canMakeNow"] is True


def test_list_is_recommended_order(world):
    c, _, h = world
    add_item(c, h, "Spinach", SOON)
    plain = c.post("/recipes", headers=h, json={**PASTA, "title": "Plain"}).json()
    spin = c.post("/recipes", headers=h, json={
        "title": "Spinach Soup", "ingredients": [{"name": "spinach", "quantity": 2, "unit": "cup"}], "steps": ["Cook."]}).json()
    titles = [r["title"] for r in c.get("/recipes", headers=h).json()]
    assert titles == ["Spinach Soup", "Plain"], (titles, plain["id"], spin["id"])


def test_replace_recipe(world):
    c, db, h = world
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    edit = {"title": "Better Pasta", "ingredients": [{"name": "penne", "quantity": 1.5, "unit": "cup"}], "steps": ["Cook it."]}
    r = c.put(f"/recipes/{rid}", headers=h, json=edit)
    assert r.status_code == 200
    d = r.json()
    assert d["title"] == "Better Pasta" and [i["name"] for i in d["ingredients"]] == ["penne"] and d["steps"] == ["Cook it."]
    assert len(db.tables["recipe_ingredients"]) == 1  # old rows gone


def test_recipes_are_private_to_their_owner(world):
    c, db, h = world
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    other = bearer(signup(c, email="b@example.com", username="bob_b"))
    assert c.get("/recipes", headers=other).json() == []
    assert c.get(f"/recipes/{rid}", headers=other).status_code == 404
    assert c.put(f"/recipes/{rid}", headers=other, json=PASTA).status_code == 404
    assert c.delete(f"/recipes/{rid}", headers=other).status_code == 404
    assert c.put(f"/recipes/{rid}/photo", headers=other, json={"imageBase64": "AAAA"}).status_code == 404
    assert c.post(f"/recipes/{rid}/cook", headers=other, json={"itemIds": []}).status_code == 404
    assert c.get(f"/recipes/{rid}", headers=h).status_code == 200


def test_delete_recipe(world):
    c, db, h = world
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    assert c.delete(f"/recipes/{rid}", headers=h).status_code == 204
    assert c.get(f"/recipes/{rid}", headers=h).status_code == 404
    assert db.tables["recipes"] == []


def test_photo_upload_replace_and_remove(world):
    c, db, h = world
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    png = base64.b64encode(b"\x89PNG fake bytes").decode()
    r = c.put(f"/recipes/{rid}/photo", headers=h, json={"imageBase64": png, "contentType": "image/png"})
    assert r.status_code == 200 and "/recipe-photos/" in r.json()["imageUrl"] and r.json()["imageUrl"].endswith(".png")
    assert len(db.storage.files) == 1
    first = next(iter(db.storage.files))
    assert first.startswith(db.tables["recipes"][0]["user_id"] + "/")

    r2 = c.put(f"/recipes/{rid}/photo", headers=h, json={"imageBase64": png})
    assert r2.status_code == 200 and len(db.storage.files) == 1 and first not in db.storage.files  # old file replaced

    assert c.put(f"/recipes/{rid}/photo", headers=h, json={"imageBase64": "!!not base64!!"}).status_code == 400
    assert c.put(f"/recipes/{rid}/photo", headers=h, json={"imageBase64": png, "contentType": "image/gif"}).status_code == 422

    assert c.delete(f"/recipes/{rid}/photo", headers=h).json()["imageUrl"] is None
    assert db.storage.files == {}
    c.put(f"/recipes/{rid}/photo", headers=h, json={"imageBase64": png})
    c.delete(f"/recipes/{rid}", headers=h)
    assert db.storage.files == {}  # deleting the recipe deletes its photo


def test_cook_uses_up_matching_items_only(world):
    c, db, h = world
    garlic = add_item(c, h, "Garlic", SOON, qty=3)
    oil = add_item(c, h, "Olive Oil", LATER, qty=1)
    milk = add_item(c, h, "Milk", LATER, qty=2)  # not in the recipe
    rid = c.post("/recipes", headers=h, json=PASTA).json()["id"]
    r = c.post(f"/recipes/{rid}/cook", headers=h, json={"itemIds": [garlic["id"], oil["id"], milk["id"]]})
    assert r.status_code == 200 and r.json() == {"updated": 1, "removed": 1}
    left = {i["itemName"]: i["quantity"] for i in c.get("/items", headers=h).json()}
    assert left == {"Garlic": 2, "Milk": 2}
    assert c.post(f"/recipes/{rid}/cook", headers=h, json={"itemIds": []}).json() == {"updated": 0, "removed": 0}


def test_ingredient_suggestions(world):
    c, _, h = world
    add_item(c, h, "Lemon Juice", LATER, qty=2)
    r = c.get("/ingredients/suggest?q=lemon", headers=h).json()
    assert r[0]["source"] == "pantry" and r[0]["name"] == "Lemon Juice" and "2 left" in r[0]["note"]
    assert any(s["name"] == "Fresh lemon" and s["note"] == "Juice or zest" and s["source"] == "common" for s in r)
    assert c.get("/ingredients/suggest?q=zzzzqq", headers=h).json() == []
    assert c.get("/ingredients/suggest?q=", headers=h).status_code == 422
    assert len(c.get("/ingredients/suggest?q=e", headers=h).json()) <= 8
