from sqlalchemy import Column, String, Float, Integer, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    project_id = Column(String, index=True)
    org_id = Column(String, index=True) # Multi-tenancy
    owner_id = Column(String, index=True) # Multi-tenancy
    
    status = Column(String, default="created", nullable=False, index=True)
    stage = Column(String, nullable=True)
    model = Column(String, nullable=False)
    satellite_source = Column(String)
    target_resolution_m = Column(Float)
    bands = Column(JSON)
    aoi_coordinates = Column(JSON) # Storing as JSON, in PostGIS it would be Geometry
    
    # Progress and Metrics
    progress = Column(Integer, default=0)
    error_code = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    
    # Metadata for dashboard
    area_km2 = Column(Float)
    lr_resolution = Column(String)
    sr_resolution = Column(String)
    
    # S3 Object Keys
    lr_image_key = Column(String)
    sr_image_key = Column(String)
    uncertainty_image_key = Column(String)
    
    # Metrics
    psnr = Column(Float)
    ssim = Column(Float)
    scale_factor = Column(Integer)
    output_res_m = Column(Float)
    metrics_summary = Column(JSON)
    calibration_status = Column(String, default="not_evaluated")
    degradation_tier = Column(Integer)
    validation_level = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
class JobStage(Base):
    __tablename__ = "job_stages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), index=True)
    name = Column(String)
    state = Column(String)
    detail = Column(String)
    progress = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
