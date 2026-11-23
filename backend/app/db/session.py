import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# --- Async Engine & Session (for FastAPI async dependencies) ---
async_connect_args = {}
async_engine_kwargs = {
    "echo": settings.ENVIRONMENT == "dev",
    "pool_pre_ping": True,
}

if "sqlite" in settings.DATABASE_URL:
    async_connect_args["check_same_thread"] = False
    async_connect_args["timeout"] = 30.0
    async_engine_kwargs["poolclass"] = NullPool
else:
    async_engine_kwargs.update({
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 10,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=async_connect_args,
    **async_engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# --- Sync Engine & Session (for migrations, worker scripts, and sync operations) ---
sync_connect_args = {}
sync_engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" in settings.SYNC_DATABASE_URL:
    sync_connect_args["check_same_thread"] = False
    sync_connect_args["timeout"] = 30.0
    sync_engine_kwargs["poolclass"] = NullPool
else:
    sync_engine_kwargs.update({
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
    })

sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    connect_args=sync_connect_args,
    **sync_engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

def get_sync_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db_tables():
    """Create all registered tables if they do not exist yet."""
    try:
        Base.metadata.create_all(bind=sync_engine)
        logger.info("db_tables_initialized_successfully")
    except Exception as exc:
        logger.warning(f"init_db_tables warning: {exc}")
