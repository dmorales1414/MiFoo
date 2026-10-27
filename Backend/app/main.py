from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, items, products

app = FastAPI(title="MiFoo API")

# The mobile app is not a browser, so CORS mostly matters for web testing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(products.router)
app.include_router(items.router)
