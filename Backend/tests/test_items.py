from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api_deps import get_current_user_id
from app.db.client import get_supabase
from app.main import app


class FakeQuery:
    """Tiny in-memory stand-in for supabase's query builder."""

    def __init__(self, rows):
        self.rows, self.op, self.payload, self.filters = rows, "select", None, []

    def select(self, *_): self.op = "select"; return self
    def insert(self, row): self.op, self.payload = "insert", row; return self
    def update(self, ch): self.op, self.payload = "update", ch; return self
    def delete(self): self.op = "delete"; return self
    def eq(self, col, val): self.filters.append((col, val)); return self
    def order(self, *_, **__): return self

    def execute(self):
        match = lambda r: all(str(r[c]) == v for c, v in self.filters)
        if self.op == "insert":
            row = {"id": str(uuid4()), "date_added": "2026-10-21T10:00:00+00:00", **self.payload}
            self.rows.append(row)
            return SimpleNamespace(data=[row])
        hits = [r for r in self.rows if match(r)]
        if self.op == "update":
            for r in hits: r.update(self.payload)
        if self.op == "delete":
            for r in hits: self.rows.remove(r)
        return SimpleNamespace(data=hits)


class FakeDB:
    def __init__(self): self.rows = []
    def table(self, _): return FakeQuery(self.rows)


ME, OTHER = uuid4(), uuid4()


@pytest.fixture
def api():
    db = FakeDB()
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_current_user_id] = lambda: ME
    yield TestClient(app), db
    app.dependency_overrides.clear()


MILK = {"itemName": "Milk", "category": "packaged", "expirationDate": "2026-10-30", "quantity": 2}


def test_create_then_list_roundtrip(api):
    c, db = api
    r = c.post("/items", json=MILK)
    assert r.status_code == 201
    body = r.json()
    assert body["itemName"] == "Milk" and body["userId"] == str(ME) and body["expirationDate"] == "2026-10-30"
    assert db.rows[0]["user_id"] == str(ME)
    assert [i["itemName"] for i in c.get("/items").json()] == ["Milk"]


def test_validation_error_is_422(api):
    c, _ = api
    assert c.post("/items", json={"itemName": "Milk", "category": "packaged"}).status_code == 422


def test_cannot_see_or_change_other_users_items(api):
    c, db = api
    db.rows.append({"id": str(uuid4()), "user_id": str(OTHER), "item_name": "Secret", "category": "produce",
                    "expiration_date": None, "date_added": "2026-10-21T10:00:00+00:00", "quantity": 1})
    other_id = db.rows[0]["id"]
    assert c.get("/items").json() == []
    assert c.patch(f"/items/{other_id}", json={"quantity": 9}).status_code == 404
    assert c.delete(f"/items/{other_id}").status_code == 404
    assert db.rows[0]["quantity"] == 1


def test_patch_and_delete_own_item(api):
    c, db = api
    item_id = c.post("/items", json=MILK).json()["id"]
    assert c.patch(f"/items/{item_id}", json={"quantity": 5}).json()["quantity"] == 5
    assert c.patch(f"/items/{item_id}", json={}).status_code == 400
    assert c.delete(f"/items/{item_id}").status_code == 204
    assert db.rows == []


def test_location_defaults_to_pantry_and_classification_is_cleaned(api):
    c, db = api
    body = c.post("/items", json=MILK).json()
    assert body["location"] == "pantry" and body["classification"] is None
    made = c.post("/items", json={**MILK, "location": "freezer", "classification": "  Ice   Cream "}).json()
    assert made["location"] == "freezer" and made["classification"] == "Ice Cream"
    blank = c.post("/items", json={**MILK, "classification": "   "}).json()
    assert blank["classification"] is None


def test_bad_location_is_422(api):
    c, _ = api
    assert c.post("/items", json={**MILK, "location": "garage"}).status_code == 422


def test_update_location_and_classification(api):
    c, _ = api
    item_id = c.post("/items", json=MILK).json()["id"]
    out = c.patch(f"/items/{item_id}", json={"location": "fridge", "classification": "Dairy"}).json()
    assert out["location"] == "fridge" and out["classification"] == "Dairy"


def test_get_one_item_is_scoped_to_the_user(api):
    c, db = api
    item_id = c.post("/items", json=MILK).json()["id"]
    assert c.get(f"/items/{item_id}").json()["itemName"] == "Milk"
    db.rows[0]["user_id"] = str(OTHER)
    assert c.get(f"/items/{item_id}").status_code == 404


def test_remove_part_of_an_item_then_the_rest(api):
    c, db = api
    item_id = c.post("/items", json={**MILK, "quantity": 3}).json()["id"]
    first = c.post(f"/items/{item_id}/remove", json={"amount": 1}).json()
    assert first["removed"] is False and first["item"]["quantity"] == 2
    last = c.post(f"/items/{item_id}/remove", json={"amount": 2}).json()
    assert last == {"removed": True, "item": None}
    assert db.rows == []


def test_remove_more_than_stored_deletes_it(api):
    c, db = api
    item_id = c.post("/items", json=MILK).json()["id"]
    assert c.post(f"/items/{item_id}/remove", json={"amount": 50}).json()["removed"] is True
    assert db.rows == []


def test_remove_validation_and_other_users(api):
    c, db = api
    item_id = c.post("/items", json=MILK).json()["id"]
    assert c.post(f"/items/{item_id}/remove", json={"amount": 0}).status_code == 422
    db.rows[0]["user_id"] = str(OTHER)
    assert c.post(f"/items/{item_id}/remove", json={"amount": 1}).status_code == 404
    assert db.rows[0]["quantity"] == 2


def test_dropped_connection_is_retried_then_503(api, monkeypatch):
    import httpx
    import app.db.retry as retry

    monkeypatch.setattr(retry.time, "sleep", lambda _s: None)
    c, _ = api
    item_id = c.post("/items", json=MILK).json()["id"]

    real = FakeQuery.execute
    calls = {"n": 0}

    def flaky(self):
        calls["n"] += 1
        if calls["n"] < 3:  # first two tries drop, the third works
            raise httpx.RemoteProtocolError("server disconnected")
        return real(self)

    monkeypatch.setattr(FakeQuery, "execute", flaky)
    assert c.get(f"/items/{item_id}").status_code == 200
    assert calls["n"] == 3

    def always(self):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(FakeQuery, "execute", always)
    r = c.get(f"/items/{item_id}")
    assert r.status_code == 503 and "try again" in r.json()["detail"]
