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
