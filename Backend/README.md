# MiFoo backend

FastAPI + Supabase. Run: `uvicorn app.main:app --reload` (docs at `/docs`). Tests: `pytest`.

## One-time setup
1. Supabase dashboard -> SQL Editor: paste and run **all** of `sql/schema.sql` (safe to re-run).
2. Authentication -> Providers -> Email: turn **Confirm email OFF** while developing (otherwise sign-up needs an inbox click before login).
3. Copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, **`SUPABASE_PUBLISHABLE_KEY`** (Project Settings -> API Keys).

## Meals (added Nov 3)
| Route | What |
|---|---|
| `GET /recipes` | the user's meals, best suggestion first, with pantry match info |
| `POST /recipes`, `GET/PUT/DELETE /recipes/{id}` | create / read / replace / delete (title, ingredients and steps required) |
| `PUT/DELETE /recipes/{id}/photo` | upload (base64 JSON, 5 MB max) or remove the photo (Supabase Storage bucket `recipe-photos`) |
| `POST /recipes/{id}/cook` | `{itemIds}`: each matching pantry item loses 1 quantity (removed at 0) |
| `GET /ingredients/suggest?q=` | ingredient ideas: your stored items first, then `app/data/ingredients.py` |

**Re-run `sql/schema.sql`** after updating. The first version of the recipe tables was never used, so it is dropped and rebuilt once (recipes now belong to a user, ingredients are name + amount + unit, steps are a list, plus the photo bucket). If the bucket line fails, create a **public** bucket named `recipe-photos` in the Supabase Storage page.

Ingredients are matched to stored items by name (`app/services/pantry.py`): "lemon" matches "Fresh Lemons". Known limit: a short ingredient also matches longer item names ("rice" matches "rice vinegar").

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
- Recipe photos are in a public bucket: anyone with the exact (random) link can view one; only the backend can upload.
- Supabase rate-limits sign-ups/logins; the API reports this as a 429.
