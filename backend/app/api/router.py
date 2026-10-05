from fastapi import APIRouter, Depends
from app.api.endpoints import dashboard, queue, projects, analysis, settings, jobs, reports, results, exports
from app.core.auth import get_current_principal

api_router = APIRouter(dependencies=[Depends(get_current_principal)])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(queue.router, tags=["queue"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(settings.router, tags=["settings"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(reports.router, tags=["reports"])
api_router.include_router(results.router, tags=["results"])
api_router.include_router(exports.router, tags=["exports"])
