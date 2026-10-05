from fastapi import APIRouter
from app.schemas import ProjectsResponse
from app.services import data_service

router = APIRouter()

@router.get("/projects", response_model=ProjectsResponse)
def projects(
    category: str | None = None,
    q: str | None = None,
    sort: str | None = None
):
    items = list(data_service.PROJECTS)
    if category and category not in (None, "All"):
        if category == "Active":
            items = [p for p in items if p["status"] == "active"]
        elif category == "Archived":
            items = [p for p in items if p["status"] == "archived"]
        else:
            items = [p for p in items if p["category"] == category]
    if q:
        ql = q.lower()
        items = [p for p in items if ql in p["name"].lower() or ql in p["description"].lower()]
    if sort == "name":
        items.sort(key=lambda p: p["name"])
    elif sort == "area":
        items.sort(key=lambda p: p["total_area_km2"], reverse=True)
    return {"projects": items, "total": len(items), "page": 1}
