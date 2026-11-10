from datetime import date

from app.services.pantry import is_expiring_soon, matches_for, name_tokens, names_match, recommended_order

TODAY = date(2026, 11, 3)


def test_names_match_handles_plurals_and_descriptors():
    assert names_match("lemon", "Fresh Lemons")
    assert names_match("tomatoes", "Tomato")
    assert names_match("yogurt", "Greek Yogurt")
    assert names_match("whole wheat pasta", "Pasta")
    assert names_match("cherries", "cherry")
    assert not names_match("chicken broth", "Chicken Breast")
    assert not names_match("", "Milk")
    assert names_match("rice", "rice vinegar")  # known limit: shorter names match longer ones
    assert name_tokens("Hummus") == {"hummus"}


def test_expiring_soon_rules():
    assert is_expiring_soon({"expiration_date": "2026-11-05"}, TODAY)
    assert is_expiring_soon({"expiration_date": "2026-11-08"}, TODAY)
    assert not is_expiring_soon({"expiration_date": "2026-11-09"}, TODAY)
    assert is_expiring_soon({"expiration_date": "2026-11-01"}, TODAY)  # already expired counts
    old = {"expiration_date": None, "category": "produce", "date_added": "2026-10-25T08:00:00+00:00"}
    assert is_expiring_soon(old, TODAY)
    fresh = {**old, "date_added": "2026-11-02T08:00:00+00:00"}
    assert not is_expiring_soon(fresh, TODAY)


def test_matches_put_expiring_first():
    items = [
        {"id": "a", "item_name": "Lemon", "quantity": 1, "category": "produce", "expiration_date": "2026-12-01"},
        {"id": "b", "item_name": "Lemons", "quantity": 2, "category": "produce", "expiration_date": "2026-11-04"},
    ]
    found = matches_for("lemon", items, TODAY)
    assert [m["id"] for m in found] == ["b", "a"]


def test_recommended_order():
    def s(name, owned, total, expiring, created):
        return {"title": name, "ingredients_owned": owned, "ingredient_count": total,
                "uses_expiring_soon": expiring, "created_at": created}
    out = recommended_order([
        s("old-complete", 3, 3, [], "2026-10-01"),
        s("uses-spinach", 1, 4, ["Spinach"], "2026-10-02"),
        s("new-complete", 3, 3, [], "2026-10-20"),
    ])
    assert [r["title"] for r in out] == ["uses-spinach", "new-complete", "old-complete"]
