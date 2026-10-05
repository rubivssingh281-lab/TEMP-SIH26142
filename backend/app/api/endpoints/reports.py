from fastapi import APIRouter, Response
from app.services import data_service
from app.services.report_service import (
    validation_report_pdf, comparison_snapshot_pdf, job_manifest_pdf, invoice_pdf
)

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
def report_job(job_id: str):
    job = next((j for j in data_service.QUEUE_JOBS if j["job_id"] == job_id), data_service.QUEUE_JOBS[0])
    job = {**job, "job_id": job_id}
    return _pdf(job_manifest_pdf(job), f"job-manifest-{job_id}.pdf")

@router.get("/reports/invoice/{inv_id}")
def report_invoice(inv_id: str, amount: float = 320, date: str = ""):
    return _pdf(invoice_pdf(inv_id, amount, date or "—"), f"invoice-{inv_id}.pdf")
