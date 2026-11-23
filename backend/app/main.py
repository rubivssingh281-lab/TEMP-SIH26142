from contextlib import asynccontextmanager
import logging
import time
import uuid
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from app.api.router import api_router
from app.core.config import settings
from app.core.errors import APIError
from app.core.auth import Principal, reset_principal, set_principal
from app.db.session import AsyncSessionLocal
from app.repository.storage import StorageRepository, object_storage
from sqlalchemy import text

logger = logging.getLogger(__name__)
request_count = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
request_duration = Histogram("http_request_duration_seconds", "HTTP request duration", ["method", "path"])

def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Vary"] = "Origin"
    return headers

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.db.session import init_db_tables
        await asyncio.to_thread(init_db_tables)
    except Exception as exc:
        logger.warning("init_db_tables_failed", extra={"error": str(exc)})

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
    headers = _cors_headers(request)
    headers["X-Trace-ID"] = trace_id
    return JSONResponse(
        status_code=exc.status_code,
        content=detail,
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    headers = _cors_headers(request)
    headers["X-Trace-ID"] = trace_id
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "validation_error",
            "message": "Request validation failed",
            "detail": exc.errors(),
            "trace_id": trace_id,
        },
        headers=headers,
    )


@app.exception_handler(ResponseValidationError)
async def response_validation_error_handler(request: Request, exc: ResponseValidationError):
    logger.exception("response_validation_error", exc_info=exc)
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    headers = _cors_headers(request)
    headers["X-Trace-ID"] = trace_id
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "response_validation_error",
            "message": "Response serialization failed",
            "detail": str(exc),
            "trace_id": trace_id,
        },
        headers=headers,
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    headers = _cors_headers(request)
    headers["X-Trace-ID"] = trace_id
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": "http_error",
            "message": str(exc.detail),
            "trace_id": trace_id,
        },
        headers=headers,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_server_exception", exc_info=exc)
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    headers = _cors_headers(request)
    headers["X-Trace-ID"] = trace_id
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "internal_error",
            "message": "Internal server error",
            "detail": str(exc),
            "trace_id": trace_id,
        },
        headers=headers,
    )


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    principal_token = set_principal(Principal(subject="anonymous", org_id=None, roles=frozenset()))
    trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    started = time.perf_counter()
    try:
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception("middleware_unhandled_exception", exc_info=exc)
            headers = _cors_headers(request)
            headers["X-Trace-ID"] = trace_id
            response = JSONResponse(
                status_code=500,
                content={
                    "error_code": "internal_error",
                    "message": "Internal server error",
                    "detail": str(exc),
                    "trace_id": trace_id,
                },
                headers=headers,
            )

        duration = time.perf_counter() - started
        try:
            request_count.labels(request.method, request.url.path, str(response.status_code)).inc()
            request_duration.labels(request.method, request.url.path).observe(duration)
        except Exception:
            pass

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
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


from app.api.endpoints import auth

app.include_router(api_router, prefix=settings.API_V1_STR)
# Compatibility alias for the existing frontend contract. `/api/v1` remains canonical.
app.include_router(api_router, prefix="/api")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])

from app.api.endpoints import notifications
app.include_router(notifications.router, prefix="", tags=["notifications"])



@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/readyz")
async def readyz():
    checks = {}

    # --- Database (always checked) ---
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "failed"

    # --- Redis (only when not using local/SQLite stack) ---
    if settings.STORAGE_BACKEND != "local":
        try:
            import redis as _redis
            await asyncio.to_thread(_redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT).ping)
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "failed"
    else:
        checks["redis"] = "skipped"

    # --- Object storage ---
    try:
        await asyncio.to_thread(object_storage._ensure_ready)
        checks["object_storage"] = "ok"
    except Exception:
        checks["object_storage"] = "failed"

    failed = [k for k, v in checks.items() if v == "failed"]
    if failed:
        raise APIError(503, "dependencies_unavailable", f"Unavailable: {', '.join(failed)}")
    return {"status": "ready", "checks": checks}


@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def root():
    return {"service": settings.PROJECT_NAME, "docs": "/docs", "health": "ok"}
