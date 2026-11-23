"""Celery application configuration with graceful fallback when Celery is not installed."""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from celery import Celery

    celery_app = Celery(
        "bhudristi_worker",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        worker_prefetch_multiplier=1,
        task_soft_time_limit=settings.JOB_TIMEOUT_SECONDS,
        task_time_limit=settings.JOB_TIMEOUT_SECONDS + 60,
    )
    celery_app.autodiscover_tasks(["app.workers"])
except ImportError:
    logger.info("Celery is not installed; running in in-process background mode.")

    class _DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(fn):
                class _Task:
                    def delay(self, *a, **kw):
                        raise RuntimeError("Celery is not installed; use in-process background runner.")
                return _Task()
            return decorator

    celery_app = _DummyCelery()
