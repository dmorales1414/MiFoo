from fastapi.testclient import TestClient

from app.db.client import get_supabase
from app.main import app


class FakeQuery:
    def __init__(self, fail):
        self.fail = fail

    def select(self, *_):
        return self

    def limit(self, *_):
        return self

    def execute(self):
        if self.fail:
            raise RuntimeError("Invalid API key")
        return object()


class FakeSupabase:
    def __init__(self, fail=False):
        self.fail = fail

    def table(self, _name):
        return FakeQuery(self.fail)


client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_health_db_ok():
    app.dependency_overrides[get_supabase] = lambda: FakeSupabase()
    try:
        r = client.get("/health/db")
        assert r.status_code == 200 and r.json()["database"] == "connected"
    finally:
        app.dependency_overrides.clear()


def test_health_db_reports_failure():
    app.dependency_overrides[get_supabase] = lambda: FakeSupabase(fail=True)
    try:
        r = client.get("/health/db")
        assert r.status_code == 503 and "Invalid API key" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()
