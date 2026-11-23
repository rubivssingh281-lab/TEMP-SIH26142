import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Response, HTTPException, Body
from app.core.config import settings
from app.services import data_service
from app.services.report_service import (
    validation_report_pdf, comparison_snapshot_pdf, job_manifest_pdf, invoice_pdf
)
from app.services.email_service import send_report_email
from app.api.endpoints.notifications import add_in_app_notification

logger = logging.getLogger(__name__)
router = APIRouter()

def _pdf(body: bytes, filename: str) -> Response:
    return Response(
        content=body,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "no-store"},
    )

@router.get("/reports/validation/{job_id}")
def report_validation(job_id: str):
    return _pdf(validation_report_pdf(data_service.build_validation(job_id)), f"validation-report-{job_id}.pdf")

@router.get("/reports/comparison/{job_id}")
def report_comparison(job_id: str):
    return _pdf(comparison_snapshot_pdf(data_service.build_comparison(job_id)), f"comparison-snapshot-{job_id}.pdf")

@router.get("/reports/job/{job_id}")
async def report_job(job_id: str):
    job = next((j for j in data_service.QUEUE_JOBS if j["job_id"] == job_id), None)
    
    # Augment with DB job details if available
    try:
        from app.db.session import AsyncSessionLocal
        from app.repository.storage import StorageRepository
        async with AsyncSessionLocal() as db:
            db_job = await StorageRepository.get_job(db, job_id)
            if db_job:
                base = job or {}
                job = {
                    **base,
                    "job_id": db_job.id,
                    "project": db_job.name or base.get("project", "Geospatial Analysis"),
                    "status": "completed" if db_job.status in ("done", "completed") else (db_job.status or "completed"),
                    "satellite_source": db_job.satellite_source or base.get("satellite_source", "Sentinel-2 MSI"),
                    "target_resolution": f"{db_job.target_resolution_m or 2.5}m / pixel (4× Gain)",
                    "area_km2": db_job.area_km2 or base.get("area_km2", 12.64),
                    "aoi_coordinates": db_job.aoi_coordinates or base.get("aoi_coordinates"),
                    "compute_node": base.get("compute_node", "GPU-Worker-1"),
                    "gpu": base.get("gpu", "NVIDIA A100-SXM4-40GB"),
                    "tiles_processed": base.get("tiles_processed", 1280),
                    "tiles_total": base.get("tiles_total", 1280),
                    "throughput_mbps": base.get("throughput_mbps", 385.0),
                }
    except Exception:
        pass

    if not job:
        job = {**data_service.QUEUE_JOBS[0], "job_id": job_id}
    else:
        job = {**job, "job_id": job_id}

    return _pdf(job_manifest_pdf(job), f"job-manifest-{job_id}.pdf")

@router.get("/reports/invoice/{inv_id}")
def report_invoice(inv_id: str, amount: float = 320, date: str = ""):
    return _pdf(invoice_pdf(inv_id, amount, date or "—"), f"invoice-{inv_id}.pdf")

@router.post("/reports/{report_type}/{job_id}/email")
async def email_report_endpoint(
    report_type: str,
    job_id: str,
    body: Optional[dict] = Body(default={})
):
    """
    Renders the requested PDF report and delivers it as an email attachment via SMTP.
    """
    recipient = (body or {}).get("email") or settings.SMTP_FROM_EMAIL or "bhudhristi@gmail.com"

    if report_type == "validation":
        pdf_bytes = validation_report_pdf(data_service.build_validation(job_id))
        filename = f"validation-report-{job_id}.pdf"
        human_title = "Validation Quality Report"
    elif report_type == "comparison":
        pdf_bytes = comparison_snapshot_pdf(data_service.build_comparison(job_id))
        filename = f"comparison-snapshot-{job_id}.pdf"
        human_title = "Comparison Analysis Snapshot"
    elif report_type == "job":
        job = next((j for j in data_service.QUEUE_JOBS if j["job_id"] == job_id), data_service.QUEUE_JOBS[0])
        pdf_bytes = job_manifest_pdf({**job, "job_id": job_id})
        filename = f"job-manifest-{job_id}.pdf"
        human_title = "Job Telemetry Manifest"
    elif report_type == "invoice":
        pdf_bytes = invoice_pdf(job_id, float((body or {}).get("amount", 320)), (body or {}).get("date", "12 Oct 2026"))
        filename = f"invoice-{job_id}.pdf"
        human_title = "Commercial Billing Invoice"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

    try:
        await asyncio.to_thread(send_report_email, recipient, human_title, job_id, pdf_bytes, filename)
    except Exception as exc:
        logger.exception("report_email_delivery_failed", extra={"recipient": recipient, "error": str(exc)})
        raise HTTPException(status_code=502, detail=f"SMTP dispatch failed: {str(exc)}")

    # Add in-app notification
    add_in_app_notification({
        "id": f"notif-report-{job_id}",
        "type": "success",
        "title": f"{human_title} Delivered",
        "message": f"PDF report for {job_id} delivered to {recipient} via SMTP.",
        "time": "Just now",
        "read": False,
        "href": f"/validation?job={job_id}" if report_type == "validation" else f"/comparison?job={job_id}",
        "tag": "Export",
    })

    return {
        "status": "success",
        "message": f"{human_title} delivered to {recipient} with attached PDF",
        "filename": filename,
    }
