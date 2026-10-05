from fastapi import APIRouter
from app.schemas import ComparisonResponse, ValidationResponse
from app.services import data_service

router = APIRouter()

@router.get("/comparison/{job_id}", response_model=ComparisonResponse)
def comparison(job_id: str):
    return data_service.build_comparison(job_id)

@router.get("/validation/{job_id}", response_model=ValidationResponse)
def validation(job_id: str):
    return data_service.build_validation(job_id)
