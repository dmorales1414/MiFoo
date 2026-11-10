"""How recipes and the user's stored items (the "pantry") interact.

Recipe ingredients are matched to items BY NAME: "2 tbsp olive oil" matches an item called
"Olive Oil", and "lemon" matches "Fresh Lemons". Everything here is plain functions with no
database calls, so it is easy to test.
"""
from datetime import date
from typing import Optional

# Same cutoffs as the app (frontend/src/utils/expiry.ts: USE_SOON_MAX_DAYS and
# PRODUCE_USE_SOON_AFTER_DAYS). Change them in both places.
EXPIRING_SOON_DAYS = 5
PRODUCE_USE_SOON_AFTER_DAYS = 5

# Words that describe HOW a food is prepared or sold, not WHAT it is. "Fresh lemon" and
# "lemons" should be the same food.
_STOP_WORDS = frozenset(
    "fresh frozen dried dry ground whole large small medium big raw ripe organic extra virgin "
    "chopped diced sliced minced grated shredded crushed boneless skinless canned of the a".split()
)


def _singular(word: str) -> str:
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"  # cherries -> cherry
    if word.endswith(("ches", "shes", "xes", "oes")) and len(word) > 4:
        return word[:-2]  # tomatoes -> tomato, peaches -> peach
    if word.endswith("s") and not word.endswith(("ss", "us", "is")) and len(word) > 3:
        return word[:-1]  # lemons -> lemon
    return word


def name_tokens(name: str) -> frozenset[str]:
    cleaned = "".join(ch if ch.isalpha() else " " for ch in name.lower())
    words = (_singular(w) for w in cleaned.split())
    return frozenset(w for w in words if w and w not in _STOP_WORDS)


def names_match(ingredient: str, item: str) -> bool:
    """True when one name's words are all contained in the other's.
    "yogurt" ~ "Greek Yogurt", "whole wheat pasta" ~ "Pasta", but "chicken broth" !~ "Chicken Breast"."""
    a, b = name_tokens(ingredient), name_tokens(item)
    return bool(a) and bool(b) and (a <= b or b <= a)


def _to_date(value) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def is_expiring_soon(item: dict, today: date) -> bool:
    expires = _to_date(item.get("expiration_date"))
    if expires is not None:
        return (expires - today).days <= EXPIRING_SOON_DAYS
    # Produce without a date is judged by how long it has been stored.
    added = _to_date(item.get("date_added"))
    return item.get("category") == "produce" and added is not None and (
        (today - added).days >= PRODUCE_USE_SOON_AFTER_DAYS
    )


def matches_for(ingredient_name: str, items: list[dict], today: date) -> list[dict]:
    """Pantry items that count as having this ingredient (soonest-to-expire first)."""
    found = [
        {
            "id": it["id"],
            "item_name": it["item_name"],
            "quantity": it.get("quantity", 1),
            "expiring_soon": is_expiring_soon(it, today),
        }
        for it in items
        if names_match(ingredient_name, it["item_name"])
    ]
    found.sort(key=lambda m: not m["expiring_soon"])
    return found


def annotate(recipe: dict, ingredient_rows: list[dict], items: list[dict], today: date) -> dict:
    """Builds the summary fields for one recipe (and the per-ingredient matches)."""
    ingredients = []
    owned = 0
    expiring_names: list[str] = []
    for row in sorted(ingredient_rows, key=lambda r: r.get("position", 0)):
        matches = matches_for(row["name"], items, today)
        if matches:
            owned += 1
        for m in matches:
            if m["expiring_soon"] and m["item_name"] not in expiring_names:
                expiring_names.append(m["item_name"])
        ingredients.append(
            {
                "id": row["id"],
                "name": row["name"],
                "quantity": float(row["quantity"]),
                "unit": row.get("unit"),
                "in_pantry": bool(matches),
                "matches": matches,
            }
        )
    total = len(ingredients)
    return {
        "id": recipe["id"],
        "title": recipe["title"],
        "image_url": recipe.get("image_url"),
        "created_at": recipe["created_at"],
        "ingredient_count": total,
        "ingredients_owned": owned,
        "can_make_now": total > 0 and owned == total,
        "uses_expiring_soon": expiring_names,
        "ingredients": ingredients,
    }


def recommended_order(summaries: list[dict]) -> list[dict]:
    """Best suggestion first: uses the most food that is about to expire, then needs the
    fewest shopping trips, then newest."""
    newest_first = sorted(summaries, key=lambda s: str(s["created_at"]), reverse=True)
    return sorted(
        newest_first,
        key=lambda s: (
            -len(s["uses_expiring_soon"]),
            -(s["ingredients_owned"] / s["ingredient_count"] if s["ingredient_count"] else 0),
        ),
    )
