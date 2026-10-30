from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, health, items, me, products
from app.services.auth import AuthFailure

app = FastAPI(title="MiFoo API")

# The mobile app is not a browser, so CORS mostly matters for web testing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AuthFailure)
async def auth_failure_handler(_request: Request, exc: AuthFailure):
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)


@app.get("/", include_in_schema=False)
def root():
    return {"name": "MiFoo API", "docs": "/docs", "health": "/health", "dbHealth": "/health/db"}


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(me.router)
app.include_router(products.router)
app.include_router(items.router)
