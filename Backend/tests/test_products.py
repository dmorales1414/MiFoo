import httpx
import pytest
from fastapi.testclient import TestClient

from app.api_deps import get_http_client
from app.main import app
from app.services.open_food_facts import InvalidBarcode, validate_barcode

NUTELLA = "3017620422003"  # real EAN-13 with a valid check digit


def make_client(handler):
    async def override():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
            yield c

    app.dependency_overrides[get_http_client] = override
    return TestClient(app)


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_test")
    yield
    app.dependency_overrides.clear()


def test_checksum():
    assert validate_barcode(NUTELLA) == NUTELLA
    assert validate_barcode(" 012345678905 ") == "012345678905"  # UPC-A
    for bad in ("3017620422004", "abc", "12345", ""):
        with pytest.raises(InvalidBarcode):
            validate_barcode(bad)


def test_found_v3_shape_and_request_details():
    seen = {}

    def handler(req: httpx.Request):
        seen["url"] = str(req.url)
        seen["ua"] = req.headers["user-agent"]
        return httpx.Response(200, json={
            "code": NUTELLA, "status": "success",
            "product": {"product_name": " Nutella ", "brands": "Ferrero,Other", "quantity": "400 g",
                        "image_front_small_url": "https://img/x.jpg"},
        })

    r = make_client(handler).get(f"/products/barcode/{NUTELLA}")
    assert r.status_code == 200
    assert r.json() == {"barcode": NUTELLA, "itemName": "Nutella", "brand": "Ferrero",
                        "quantityText": "400 g", "imageUrl": "https://img/x.jpg", "category": "packaged"}
    assert "/api/v3/product/3017620422003.json" in seen["url"] and "fields=" in seen["url"]
    assert "MiFoo" in seen["ua"]


def test_not_found_variants():
    for resp in (
        httpx.Response(404, json={"status": "failure"}),
        httpx.Response(200, json={"status": "failure", "product": None}),
        httpx.Response(200, json={"status": 0}),
        httpx.Response(200, json={"status": "success", "product": {"product_name": "", "brands": ""}}),
    ):
        assert make_client(lambda _r, resp=resp: resp).get(f"/products/barcode/{NUTELLA}").status_code == 404


def test_generic_name_fallback():
    r = make_client(lambda _r: httpx.Response(200, json={"status": "success", "product": {"generic_name": "Hazelnut spread"}}))
    assert r.get(f"/products/barcode/{NUTELLA}").json()["itemName"] == "Hazelnut spread"


def test_bad_barcode_makes_no_api_call():
    def handler(_r):
        raise AssertionError("should not call Open Food Facts")

    assert make_client(handler).get("/products/barcode/3017620422004").status_code == 400


def test_upstream_failures_are_502():
    assert make_client(lambda _r: httpx.Response(503)).get(f"/products/barcode/{NUTELLA}").status_code == 502

    def boom(_r):
        raise httpx.ConnectError("down")

    assert make_client(boom).get(f"/products/barcode/{NUTELLA}").status_code == 502
