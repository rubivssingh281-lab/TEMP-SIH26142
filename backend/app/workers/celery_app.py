from celery import Celery
from app.core.config import settings

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
    task_acks_late=True, # Critical for reliability: job redelivered if worker crashes
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # One job per GPU worker
    task_soft_time_limit=settings.JOB_TIMEOUT_SECONDS,
    task_time_limit=settings.JOB_TIMEOUT_SECONDS + 60,
)

# Discover tasks
celery_app.autodiscover_tasks(["app.workers"])
