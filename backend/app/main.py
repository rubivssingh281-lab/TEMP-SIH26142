from contextlib import asynccontextmanager
import logging
import time
import uuid
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from app.api.router import api_router
from app.core.config import settings
from app.core.errors import APIError
from app.core.auth import Principal, reset_principal, set_principal
from app.db.session import AsyncSessionLocal
from app.repository.storage import StorageRepository, object_storage
from sqlalchemy import text
import redis

logger = logging.getLogger(__name__)
request_count = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
request_duration = Histogram("http_request_duration_seconds", "HTTP request duration", ["method", "path"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with AsyncSessionLocal() as db:
            recovered = await StorageRepository.recover_interrupted_jobs(db)
            if recovered:
                logger.warning("recovered_interrupted_jobs", extra={"count": recovered})
    except Exception as exc:
        logger.warning("startup_recovery_failed", extra={"error": str(exc)})
    yield
    # Cleanup on shutdown

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    detail = dict(exc.detail) if isinstance(exc.detail, dict) else {"error_code": "api_error", "message": str(exc.detail)}
    detail["trace_id"] = trace_id
    return JSONResponse(
        status_code=exc.status_code,
        content=detail,
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "validation_error",
            "message": "Request validation failed",
            "trace_id": getattr(request.state, "trace_id", str(uuid.uuid4())),
        },
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": "http_error",
            "message": str(exc.detail),
            "trace_id": getattr(request.state, "trace_id", str(uuid.uuid4())),
        },
    )


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    principal_token = set_principal(Principal(subject="anonymous", org_id=None, roles=frozenset()))
    trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
        duration = time.perf_counter() - started
        request_count.labels(request.method, request.url.path, str(response.status_code)).inc()
        request_duration.labels(request.method, request.url.path).observe(duration)
        response.headers["X-Trace-ID"] = trace_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        logger.info("http_request", extra={"trace_id": trace_id, "method": request.method, "path": request.url.path, "status": response.status_code, "duration_seconds": duration})
        return response
    finally:
        reset_principal(principal_token)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.endpoints import auth

app.include_router(api_router, prefix=settings.API_V1_STR)
# Compatibility alias for the existing frontend contract. `/api/v1` remains canonical.
app.include_router(api_router, prefix="/api")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/readyz")
async def readyz():
    checks = {}
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "failed"

    try:
        await asyncio.to_thread(redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT).ping)
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "failed"

    try:
        await asyncio.to_thread(object_storage._ensure_ready)
        checks["object_storage"] = "ok"
    except Exception:
        checks["object_storage"] = "failed"

    if any(value != "ok" for value in checks.values()):
        raise APIError(503, "dependencies_unavailable", "One or more backend dependencies are unavailable")
    return {"status": "ready", "checks": checks}


@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def root():
    return {"service": settings.PROJECT_NAME, "docs": "/docs", "health": "ok"}
