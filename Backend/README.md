# MiFoo backend

FastAPI + Supabase. Run: `uvicorn app.main:app --reload` (docs at `/docs`). Tests: `pytest`.

## One-time setup
1. Supabase dashboard -> SQL Editor: paste and run **all** of `sql/schema.sql` (safe to re-run).
2. Authentication -> Providers -> Email: turn **Confirm email OFF** while developing (otherwise sign-up needs an inbox click before login).
3. Copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, **`SUPABASE_PUBLISHABLE_KEY`** (Project Settings -> API Keys).

## Accounts
| Route | What |
|---|---|
| `POST /auth/signup` | `{email, displayName, username, password}` -> `{session, needsEmailConfirmation}` |
| `POST /auth/login` | `{identifier (username or email), password}` -> `{accessToken, refreshToken, expiresAt}` |
| `POST /auth/refresh` | `{refreshToken}` -> new session |
| `GET/PATCH /me` | own profile + private info (email, phone, push toggle) |
| `/items`, ... | require `Authorization: Bearer <accessToken>`; always filtered to that user |

Public profile data (`profiles`: username, display name, avatar) is separate from private data
(`profile_private`: email, phone, push toggle), which only this backend can read.

## Security notes
- Secret key stays on the server. The server bypasses row-level security, so every query filters by the caller's id.
- Use HTTPS when deployed; passwords travel to this API. Restrict CORS `allow_origins` then.
- Verified tokens are cached for `AUTH_CACHE_SECONDS` (60), so a logged-out token may work up to a minute.
- Supabase rate-limits sign-ups/logins; the API reports this as a 429.
