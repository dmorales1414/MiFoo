from collections.abc import Callable

from fastapi import APIRouter, Depends
from supabase import Client

from app.db.client import get_auth_client_factory, get_supabase
from app.schemas.auth import AuthResult, LoginRequest, RefreshRequest, SessionOut, SignUpRequest
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResult, response_model_by_alias=True, status_code=201)
def sign_up(
    body: SignUpRequest,
    db: Client = Depends(get_supabase),
    make_auth_client: Callable[[], Client] = Depends(get_auth_client_factory),
):
    session = auth_service.sign_up(db, make_auth_client, body)
    return AuthResult(session=session, needs_email_confirmation=session is None)


@router.post("/login", response_model=SessionOut, response_model_by_alias=True)
def log_in(
    body: LoginRequest,
    db: Client = Depends(get_supabase),
    make_auth_client: Callable[[], Client] = Depends(get_auth_client_factory),
):
    return auth_service.log_in(db, make_auth_client, body)


@router.post("/refresh", response_model=SessionOut, response_model_by_alias=True)
def refresh(
    body: RefreshRequest,
    make_auth_client: Callable[[], Client] = Depends(get_auth_client_factory),
):
    return auth_service.refresh(make_auth_client, body.refresh_token)
