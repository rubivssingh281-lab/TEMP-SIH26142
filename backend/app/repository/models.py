from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class JobRecord(BaseModel):
    """Represents a row in the SQLite jobs table."""
    id: str
    status: str
    stage: str
    progress: int = 0
    created_at: str
    updated_at: str
    
    # Input facts (filled at upload/validate)
    input_path: Optional[str] = None
    input_crs: Optional[str] = None
    input_bands: Optional[List[str]] = None
    input_res_m: Optional[float] = None
    input_size: Optional[List[int]] = None
    
    # Config (filled by PATCH /config)
    config: Optional[Dict[str, Any]] = None
    
    # Results (filled by orchestrator)
    scale_factor: Optional[int] = None
    output_res_m: Optional[float] = None
    metrics_summary: Optional[Dict[str, Any]] = None
    calibration_status: str = 'not_evaluated'
    degradation_tier: Optional[int] = None
    validation_level: Optional[List[str]] = None
    
    # Failure
    error_code: Optional[str] = None
    error_message: Optional[str] = None
