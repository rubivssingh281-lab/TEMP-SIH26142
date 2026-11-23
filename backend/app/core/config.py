from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bhu-Dristi API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "production" # dev, staging, production
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sih-26142.vercel.app",
    ]


    # Upload safety limits
    MAX_UPLOAD_BYTES: int = 100 * 1024 * 1024
    MAX_RASTER_PIXELS: int = 50_000_000
    MAX_RASTER_BANDS: int = 16
    USE_REAL_GEOSPATIAL: bool = False
    INFERENCE_BACKEND: str = "geosrnet"
    INFERENCE_FACTORY: Optional[str] = "app.services.geosrnet_inference:create_geosrnet_service"
    JOB_TIMEOUT_SECONDS: int = 3600

    # GeoSRNet model checkpoint
    GEOSRNET_CHECKPOINT_PATH: Optional[str] = None

    # Storage backend: "local" (filesystem) or "s3" (MinIO / S3)
    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_DIR: str = str((Path(__file__).resolve().parents[2] / "data" / "jobs").resolve())

    # Database URL override (e.g. Supabase Session Pooler: postgresql://...)
    RAW_DATABASE_URL: Optional[str] = Field(default=None, alias="DATABASE_URL")

    # PostgreSQL Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "bhudristi"
    POSTGRES_PORT: int = 5432

    @property
    def _default_sqlite_path(self) -> Path:
        data_dir = Path(__file__).resolve().parents[2] / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        return (data_dir / "geosr.db").resolve()
    
    @property
    def DATABASE_URL(self) -> str:
        if self.RAW_DATABASE_URL:
            raw = self.RAW_DATABASE_URL
            if raw.startswith("postgresql://"):
                return raw.replace("postgresql://", "postgresql+asyncpg://", 1)
            if raw.startswith("sqlite://") and not raw.startswith("sqlite+aiosqlite://"):
                return raw.replace("sqlite://", "sqlite+aiosqlite://", 1)
            return raw
        # Default to SQLite for local dev (no Postgres needed)
        return f"sqlite+aiosqlite:///{self._default_sqlite_path.as_posix()}"
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.RAW_DATABASE_URL:
            raw = self.RAW_DATABASE_URL
            if raw.startswith("postgresql://"):
                return raw.replace("postgresql://", "postgresql+psycopg2://", 1)
            if raw.startswith("sqlite+aiosqlite://"):
                return raw.replace("sqlite+aiosqlite://", "sqlite://", 1)
            return raw
        # Default to SQLite for local dev
        return f"sqlite:///{self._default_sqlite_path.as_posix()}"

    # Redis (Broker & Cache)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB_CELERY: int = 0
    REDIS_DB_CACHE: int = 1
    
    @property
    def CELERY_BROKER_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_CELERY}"
    
    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_CELERY}"
        
    @property
    def REDIS_CACHE_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_CACHE}"

    # S3 / MinIO Object Storage
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_REGION: str = "us-east-1"
    S3_BUCKET_JOBS: str = "bhu-dristi-jobs"
    S3_BUCKET_MODELS: str = "bhu-dristi-models"
    
    # Auth (Keycloak / OIDC)
    OIDC_ISSUER_URL: str = "http://localhost:8080/realms/bhudristi"
    OIDC_AUDIENCE: str = "account"
    OIDC_JWKS_URL: Optional[str] = None
    AUTH_ENABLED: bool = False

    # Supabase Auth HTTPS Dispatch & Database Relay
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None

    # JWT Authentication & Passwords
    SECRET_KEY: str = "bhudristi-enterprise-secret-key-super-resolution-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    @property
    def access_token_expire_minutes(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES
    
    # SMTP / OTP Auth (Supports Gmail SMTP & Supabase Custom SMTP relay)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "bhudhristi@gmail.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "bhudhristi@gmail.com"

    # Universal guide & Supabase aliases
    MAIL_SERVER: Optional[str] = None
    MAIL_PORT: Optional[int] = None
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: Optional[str] = None

    @property
    def effective_smtp_host(self) -> str:
        return self.MAIL_SERVER or self.SMTP_HOST

    @property
    def effective_smtp_port(self) -> int:
        return self.MAIL_PORT or self.SMTP_PORT

    @property
    def effective_smtp_user(self) -> str:
        return self.MAIL_USERNAME or self.SMTP_USER

    @property
    def effective_smtp_password(self) -> str:
        return self.MAIL_PASSWORD or self.SMTP_PASSWORD

    @property
    def effective_smtp_from(self) -> str:
        return self.MAIL_FROM or self.SMTP_FROM_EMAIL or self.effective_smtp_user
    
    # Sentry & Observability
    SENTRY_DSN: Optional[str] = None
    OTEL_EXPORTER_OTLP_ENDPOINT: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        case_sensitive=True,
        populate_by_name=True,
        extra="ignore",
    )

settings = Settings()
