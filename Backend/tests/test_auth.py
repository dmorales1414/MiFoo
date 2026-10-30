import pytest
from fastapi.testclient import TestClient

from app.db.client import get_auth_client_factory, get_supabase
from app.main import app
from app.services import auth as auth_service
from tests.fakes import FakeAuth, FakeAuthClient, FakeDB

SIGNUP = {"email": "Dan@Example.com", "displayName": "Daniel Morales", "username": "dan_m", "password": "hunter2hunter2"}


@pytest.fixture
def world():
    db = FakeDB()
    fake = FakeAuth(db)
    auth_service.clear_token_cache()
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_auth_client_factory] = lambda: (lambda: FakeAuthClient(fake))
    yield TestClient(app), db, fake
    app.dependency_overrides.clear()


def signup(c, **over):
    return c.post("/auth/signup", json={**SIGNUP, **over})


def bearer(res):
    return {"Authorization": f"Bearer {res.json()['session']['accessToken']}"}


def test_signup_returns_session_and_creates_profile(world):
    c, db, _ = world
    r = signup(c)
    assert r.status_code == 201
    body = r.json()
    assert body["needsEmailConfirmation"] is False
    assert body["session"]["accessToken"] and body["session"]["refreshToken"]
    assert db.tables["profiles"][0]["display_name"] == "Daniel Morales"
    assert db.tables["profile_private"][0]["email"] == "dan@example.com"


def test_signup_validation(world):
    c, _, _ = world
    assert signup(c, password="short").status_code == 422
    assert signup(c, username="a b").status_code == 422
    assert signup(c, email="nope").status_code == 422
    assert signup(c, displayName="  ").status_code == 422


def test_username_taken_is_case_insensitive_and_underscore_safe(world):
    c, _, _ = world
    assert signup(c).status_code == 201
    r = signup(c, email="b@example.com", username="DAN_M")
    assert r.status_code == 409 and "username" in r.json()["detail"]
    # "_" is a LIKE wildcard: danXm must NOT count as taken
    assert signup(c, email="c@example.com", username="danXm").status_code == 201


def test_duplicate_email(world):
    c, _, _ = world
    signup(c)
    r = signup(c, username="other_name")
    assert r.status_code == 409 and "email" in r.json()["detail"]


def test_email_confirmation_flow_has_no_session(world):
    c, db, fake = world
    fake.confirm_email = True
    r = signup(c)
    assert r.status_code == 201
    assert r.json() == {"session": None, "needsEmailConfirmation": True}


def test_login_with_username_or_email(world):
    c, _, _ = world
    signup(c)
    for ident in ("dan_m", "DAN_M", "dan@example.com"):
        r = c.post("/auth/login", json={"identifier": ident, "password": SIGNUP["password"]})
        assert r.status_code == 200, ident
        assert r.json()["accessToken"]


def test_bad_login_messages_do_not_reveal_which_part_was_wrong(world):
    c, _, _ = world
    signup(c)
    wrong_pw = c.post("/auth/login", json={"identifier": "dan_m", "password": "nope-nope"})
    no_user = c.post("/auth/login", json={"identifier": "ghost", "password": "nope-nope"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json() == no_user.json()


def test_refresh(world):
    c, _, _ = world
    first = signup(c).json()["session"]
    r = c.post("/auth/refresh", json={"refreshToken": first["refreshToken"]})
    assert r.status_code == 200 and r.json()["accessToken"] != first["accessToken"]
    assert c.post("/auth/refresh", json={"refreshToken": "bogus"}).status_code == 401


def test_me_requires_login(world):
    c, _, _ = world
    assert c.get("/me").status_code == 401
    assert c.get("/me", headers={"Authorization": "Bearer junk"}).status_code == 401
    assert c.get("/items").status_code == 401


def test_me_get_and_update(world):
    c, _, _ = world
    h = bearer(signup(c))
    me = c.get("/me", headers=h).json()
    assert me["username"] == "dan_m" and me["displayName"] == "Daniel Morales"
    assert me["email"] == "dan@example.com" and me["phone"] is None
    assert me["pushNotificationsEnabled"] is True

    r = c.patch("/me", headers=h, json={"phone": "(555) 123-4567", "pushNotificationsEnabled": False, "displayName": "Dan"})
    assert r.status_code == 200
    me = r.json()
    assert me["phone"] == "(555) 123-4567" and me["pushNotificationsEnabled"] is False and me["displayName"] == "Dan"

    assert c.patch("/me", headers=h, json={"phone": ""}).json()["phone"] is None
    assert c.patch("/me", headers=h, json={}).status_code == 400
    assert c.patch("/me", headers=h, json={"phone": "abc"}).status_code == 422
    assert c.patch("/me", headers=h, json={"pushNotificationsEnabled": None}).status_code == 400


def test_me_username_change_conflict(world):
    c, _, _ = world
    h1 = bearer(signup(c))
    signup(c, email="b@example.com", username="bob_b")
    assert c.patch("/me", headers=h1, json={"username": "BOB_B"}).status_code == 409
    assert c.patch("/me", headers=h1, json={"username": "DAN_M"}).status_code == 200  # own name, new casing


def test_me_creates_missing_rows_for_old_accounts(world):
    c, db, fake = world
    h = bearer(signup(c))
    db.tables["profiles"].clear()
    db.tables["profile_private"].clear()
    assert c.get("/me", headers=h).status_code == 200
    assert len(db.tables["profiles"]) == 1


def test_token_is_cached_briefly(world):
    c, _, fake = world
    h = bearer(signup(c))
    c.get("/me", headers=h); c.get("/me", headers=h); c.get("/me", headers=h)
    assert fake.calls == 1


def test_items_are_scoped_to_the_logged_in_user(world):
    c, db, _ = world
    h1 = bearer(signup(c))
    h2 = bearer(signup(c, email="b@example.com", username="bob_b"))
    item = {"itemName": "Milk", "category": "packaged", "expirationDate": "2026-10-30", "quantity": 1}
    assert c.post("/items", headers=h1, json=item).status_code in (200, 201)
    assert len(c.get("/items", headers=h1).json()) == 1
    assert c.get("/items", headers=h2).json() == []
