from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings


@dataclass(frozen=True)
class Principal:
    subject: str
    org_id: str | None
    roles: frozenset[str]


_current_principal: ContextVar[Principal] = ContextVar(
    "current_principal",
    default=Principal(subject="anonymous", org_id=None, roles=frozenset()),
)
_bearer = HTTPBearer(auto_error=False)


def current_principal() -> Principal:
    return _current_principal.get()


def set_principal(principal: Principal):
    return _current_principal.set(principal)


def reset_principal(token):
    _current_principal.reset(token)


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    if not settings.AUTH_ENABLED:
        principal = Principal(subject="anonymous", org_id=None, roles=frozenset())
        _current_principal.set(principal)
        return principal
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer authentication required")

    try:
        import httpx
        from jose import jwt

        jwks_url = settings.OIDC_JWKS_URL or f"{settings.OIDC_ISSUER_URL}/protocol/openid-connect/certs"
        async with httpx.AsyncClient(timeout=5.0) as client:
            jwks = (await client.get(jwks_url)).raise_for_status().json()
        header = jwt.get_unverified_header(credentials.credentials)
        key = next(key for key in jwks["keys"] if key["kid"] == header["kid"])
        claims = jwt.decode(
            credentials.credentials,
            key,
            algorithms=["RS256"],
            audience=settings.OIDC_AUDIENCE,
            issuer=settings.OIDC_ISSUER_URL,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from exc

    org_id = claims.get("org_id") or claims.get("tenant_id") or claims.get("organization")
    if not org_id:
        raise HTTPException(status_code=403, detail="Token has no organization claim")
    roles = set(claims.get("roles", []))
    roles.update(claims.get("realm_access", {}).get("roles", []))
    principal = Principal(subject=claims["sub"], org_id=str(org_id), roles=frozenset(roles))
    _current_principal.set(principal)
    return principal


def require_role(role: str):
    async def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if role not in principal.roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return principal

    return dependency
