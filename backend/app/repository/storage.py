import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Job
from app.core.auth import current_principal
from app.core.config import settings
import json
from typing import Optional, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class ObjectStorage:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION
        )
        self.bucket = settings.S3_BUCKET_JOBS
        self._bucket_ready = False

    def _ensure_ready(self):
        if not self._bucket_ready:
            self._ensure_bucket()
            self._bucket_ready = True
        
    def _ensure_bucket(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket)

    def write_object(self, job_id: str, object_key: str, data: bytes):
        self._ensure_ready()
        key = f"{job_id}/{object_key}"
        self.s3_client.put_object(Bucket=self.bucket, Key=key, Body=data)

    def read_object(self, job_id: str, object_key: str) -> Optional[bytes]:
        self._ensure_ready()
        key = f"{job_id}/{object_key}"
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise

    def delete_object(self, job_id: str, object_key: str):
        self._ensure_ready()
        key = f"{job_id}/{object_key}"
        self.s3_client.delete_object(Bucket=self.bucket, Key=key)

    def get_presigned_url(self, job_id: str, object_key: str, expiration=3600) -> Optional[str]:
        self._ensure_ready()
        key = f"{job_id}/{object_key}"
        try:
            # Check if exists
            self.s3_client.head_object(Bucket=self.bucket, Key=key)
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError:
            return None

object_storage = ObjectStorage()

class StorageRepository:
    """
    Adapter bridging the old StorageRepository interface to Postgres & S3.
    Note: the old interface was sync. We provide async versions here for FastAPI.
    """
    
    @staticmethod
    def write_object(job_id: str, object_key: str, data: bytes):
        object_storage.write_object(job_id, object_key, data)
        
    @staticmethod
    def read_object(job_id: str, object_key: str) -> Optional[bytes]:
        return object_storage.read_object(job_id, object_key)
        
    @staticmethod
    def get_presigned_url(job_id: str, object_key: str) -> Optional[str]:
        return object_storage.get_presigned_url(job_id, object_key)

    @staticmethod
    async def create_job(db: AsyncSession, job_data: dict) -> Job:
        if settings.AUTH_ENABLED:
            principal = current_principal()
            if not principal.org_id:
                raise PermissionError("organization_context_required")
            job_data = {
                **job_data,
                "org_id": principal.org_id,
                "owner_id": principal.subject,
            }
        job = Job(**job_data)
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def update_job(db: AsyncSession, job_id: str, updates: Dict[str, Any]):
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            for key, value in updates.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            await db.commit()
            
    @staticmethod
    async def get_job(db: AsyncSession, job_id: str) -> Optional[Job]:
        query = select(Job).where(Job.id == job_id)
        if settings.AUTH_ENABLED:
            query = query.where(Job.org_id == current_principal().org_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def recover_interrupted_jobs(db: AsyncSession) -> int:
        result = await db.execute(select(Job).where(Job.status.not_in(["done", "failed"])))
        jobs = result.scalars().all()
        for job in jobs:
            job.status = "failed"
            job.stage = "interrupted"
            job.progress = min(job.progress or 0, 99)
            job.error_code = "interrupted"
            job.error_message = "Job was interrupted by a service restart"
        if jobs:
            await db.commit()
        return len(jobs)
