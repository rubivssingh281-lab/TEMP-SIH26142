from fastapi import APIRouter
from app.schemas import DashboardResponse
from app.services import data_service

router = APIRouter()

@router.get("/dashboard", response_model=DashboardResponse)
def dashboard():
    return data_service.DASHBOARD
