"""In-memory stand-ins for Supabase, so tests run without a network."""
import re
from types import SimpleNamespace
from uuid import uuid4

from supabase_auth.errors import AuthApiError


class FakeQuery:
    def __init__(self, rows):
        self.rows, self.op, self.payload, self.filters, self._limit = rows, "select", None, [], None

    def select(self, *_): self.op = "select"; return self
    def insert(self, row): self.op, self.payload = "insert", row; return self
    def update(self, ch): self.op, self.payload = "update", ch; return self
    def delete(self): self.op = "delete"; return self
    def eq(self, col, val): self.filters.append(("eq", col, str(val))); return self
    def neq(self, col, val): self.filters.append(("neq", col, str(val))); return self
    def ilike(self, col, pattern): self.filters.append(("ilike", col, pattern)); return self
    def order(self, *_, **__): return self
    def limit(self, n): self._limit = n; return self

    def _ok(self, row):
        for kind, col, val in self.filters:
            have = row.get(col)
            if kind == "eq" and str(have) != val: return False
            if kind == "neq" and str(have) == val: return False
            if kind == "ilike":
                # turn the LIKE pattern into a regex (\_ and \% are escaped literals)
                rx = "".join(
                    re.escape(ch2) if esc else (".*" if ch2 == "%" else "." if ch2 == "_" else re.escape(ch2))
                    for esc, ch2 in _tokens(val)
                )
                if have is None or not re.fullmatch(rx, str(have), re.I): return False
        return True

    def execute(self):
        if self.op == "insert":
            row = {"id": str(uuid4()), "date_added": "2026-10-21T10:00:00+00:00",
                   "created_at": "2026-10-28T10:00:00+00:00", **self.payload}
            self.rows.append(row)
            return SimpleNamespace(data=[row])
        hits = [r for r in self.rows if self._ok(r)]
        if self.op == "update":
            for r in hits: r.update(self.payload)
        if self.op == "delete":
            for r in hits: self.rows.remove(r)
        return SimpleNamespace(data=hits[: self._limit] if self._limit else hits)


def _tokens(pattern):
    i = 0
    while i < len(pattern):
        if pattern[i] == "\\" and i + 1 < len(pattern):
            yield True, pattern[i + 1]; i += 2
        else:
            yield False, pattern[i]; i += 1


class FakeDB:
    def __init__(self):
        self.tables = {}

    def table(self, name):
        return FakeQuery(self.tables.setdefault(name, []))

    @property
    def rows(self):  # convenience for the items tests
        return self.tables.setdefault("items", [])


class FakeAuth:
    """Stands in for Supabase Auth. Also mimics the database trigger that creates profile rows."""

    def __init__(self, db, confirm_email=False):
        self.db, self.confirm_email = db, confirm_email
        self.users = {}  # email -> {id, password}
        self.tokens = {}  # access token -> user id
        self.refresh_tokens = {}  # refresh token -> user id
        self.calls = 0

    def _session(self, uid):
        n = len(self.tokens) + 1
        access, refresh = f"access-{n}", f"refresh-{n}"
        self.tokens[access] = uid
        self.refresh_tokens[refresh] = uid
        return SimpleNamespace(access_token=access, refresh_token=refresh, expires_at=2_000_000_000, expires_in=3600)

    def sign_up(self, creds):
        if creds["email"] in self.users:
            raise AuthApiError("User already registered", 422, "user_already_exists")
        uid = str(uuid4())
        self.users[creds["email"]] = {"id": uid, "password": creds["password"]}
        meta = creds["options"]["data"]
        self.db.table("profiles").insert({"id": uid, "username": meta["username"], "display_name": meta["display_name"]}).execute()
        self.db.table("profile_private").insert({"id": uid, "email": creds["email"]}).execute()
        user = SimpleNamespace(id=uid, identities=[object()])
        return SimpleNamespace(user=user, session=None if self.confirm_email else self._session(uid))

    def sign_in_with_password(self, creds):
        u = self.users.get(creds["email"])
        if not u or u["password"] != creds["password"]:
            raise AuthApiError("Invalid login credentials", 400, "invalid_credentials")
        return SimpleNamespace(user=SimpleNamespace(id=u["id"]), session=self._session(u["id"]))

    def refresh_session(self, token):
        uid = self.refresh_tokens.get(token)
        if not uid:
            raise AuthApiError("Invalid Refresh Token", 400, "refresh_token_not_found")
        return SimpleNamespace(user=SimpleNamespace(id=uid), session=self._session(uid))

    def get_user(self, token):
        self.calls += 1
        uid = self.tokens.get(token)
        if not uid:
            raise AuthApiError("invalid JWT", 401, "bad_jwt")
        return SimpleNamespace(user=SimpleNamespace(id=uid))


class FakeAuthClient:
    def __init__(self, auth): self.auth = auth
