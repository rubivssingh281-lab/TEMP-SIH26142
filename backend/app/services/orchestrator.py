import logging
import json
import numpy as np
from app.repository.storage import StorageRepository, object_storage
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.inference import InferenceConfig
from app.services.providers import (
    get_inference_service,
    get_preprocessing_service,
    get_validation_service,
)
from app.services.artifacts import (
    enhanced_tiff,
    uncertainty_tiff,
    rgb_png,
    uncertainty_png,
)
from app.services.geospatial import georeferenced_tiffs
from app.services.applications import ApplicationService

logger = logging.getLogger(__name__)

class Orchestrator:
    @staticmethod
    async def _update_stage(db: AsyncSession, job_id: str, status: str, stage: str, progress: int):
        await StorageRepository.update_job(db, job_id, {
            "status": status,
            "stage": stage,
            "progress": progress
        })

    @staticmethod
    async def _fail_job(db: AsyncSession, job_id: str, code: str, msg: str):
        logger.error(f"Job {job_id} failed: [{code}] {msg}")
        await StorageRepository.update_job(db, job_id, {
            "status": "failed",
            "error_code": code,
            "error_message": msg
        })

    @staticmethod
    async def run_pipeline(db: AsyncSession, job_id: str):
        try:
            job = await StorageRepository.get_job(db, job_id)
            if not job:
                logger.error(f"Job {job_id} not found during execution.")
                return

            input_bytes = object_storage.read_object(job_id, job.lr_image_key)

            # 1. Preprocessing
            await Orchestrator._update_stage(db, job_id, "preprocessing", "preparing_tensors", 10)
            lr_tensor, valid_mask, geo_meta = get_preprocessing_service().process(input_bytes)
            
            # 2. Inference
            await Orchestrator._update_stage(db, job_id, "inference", "running_model", 30)
            
            # In real system, model config comes from job
            inf_config = InferenceConfig(model=job.model, scale=4)
            sr_result = get_inference_service().predict(lr_tensor, valid_mask, inf_config)
            
            # 3. Postprocessing
            await Orchestrator._update_stage(db, job_id, "postprocessing", "restoring_geo_metadata", 70)
            
            if geo_meta.get("georeferenced"):
                enhanced_bytes, uncertainty_bytes, bounds = georeferenced_tiffs(
                    sr_result.sr, sr_result.uncertainty, geo_meta, inf_config.scale
                )
            else:
                enhanced_bytes = enhanced_tiff(sr_result.sr)
                uncertainty_bytes = uncertainty_tiff(sr_result.uncertainty)
                bounds = None
            object_storage.write_object(job_id, "output/enhanced.tif", enhanced_bytes)
            object_storage.write_object(job_id, "output/uncertainty.tif", uncertainty_bytes)
                
            # 4. Validation
            await Orchestrator._update_stage(db, job_id, "validation", "computing_metrics", 85)
            metrics_summary = get_validation_service().compute_metrics(sr_result.sr, lr_tensor)
            
            object_storage.write_object(job_id, "metrics.json", json.dumps(metrics_summary).encode("utf-8"))

            applications = ApplicationService.build(sr_result.sr, job_id)
            for application_name, application_data in applications.items():
                object_storage.write_object(
                    job_id,
                    f"applications/{application_name}.json",
                    json.dumps(application_data).encode("utf-8"),
                )
                
            object_storage.write_object(job_id, "preview/original.png", rgb_png(lr_tensor))
            object_storage.write_object(job_id, "preview/enhanced.png", rgb_png(sr_result.sr))
            object_storage.write_object(job_id, "preview/uncertainty.png", uncertainty_png(sr_result.uncertainty))
            
            manifest = {
                "model_version": sr_result.meta["model_version"],
                "crs": geo_meta["crs"],
                "transform": geo_meta["transform"],
                "input_size": [geo_meta["width"], geo_meta["height"]],
                "output_size": [sr_result.sr.shape[2], sr_result.sr.shape[1]],
                "bands": geo_meta["bands"],
                "scale_factor": inf_config.scale,
                "output_resolution_m": 2.5,
                "calibration_status": sr_result.meta.get("calibration_status", "not_evaluated"),
                "degradation_tier": 0,
                "validation_level": ["self_consistency"]
            }
            if bounds:
                manifest["bounds"] = bounds
            else:
                manifest["bounds"] = geo_meta.get("bounds")
            uncertainty = np.asarray(sr_result.uncertainty)
            manifest["confidence_summary"] = {
                "high": round(float(np.mean(uncertainty <= 0.33)), 6),
                "medium": round(float(np.mean((uncertainty > 0.33) & (uncertainty <= 0.66))), 6),
                "low": round(float(np.mean(uncertainty > 0.66)), 6),
            }
            object_storage.write_object(job_id, "manifest.json", json.dumps(manifest).encode("utf-8"))
            
            # 5. Done
            await StorageRepository.update_job(db, job_id, {
                "status": "done",
                "stage": "complete",
                "progress": 100,
                "sr_image_key": "preview/enhanced.png",
                "uncertainty_image_key": "preview/uncertainty.png",
                "psnr": metrics_summary.get("psnr", 0.0),
                "ssim": metrics_summary.get("ssim", 0.0),
                "scale_factor": inf_config.scale,
                "output_res_m": 2.5,
                "metrics_summary": metrics_summary,
                "calibration_status": sr_result.meta.get("calibration_status", "not_evaluated"),
                "degradation_tier": 0,
                "validation_level": ["self_consistency"]
            })
            if bounds:
                manifest["bounds"] = bounds
            else:
                manifest["bounds"] = geo_meta.get("bounds")
            uncertainty = np.asarray(sr_result.uncertainty)
            manifest["confidence_summary"] = {
                "high": round(float(np.mean(uncertainty <= 0.33)), 6),
                "medium": round(float(np.mean((uncertainty > 0.33) & (uncertainty <= 0.66))), 6),
                "low": round(float(np.mean(uncertainty > 0.66)), 6),
            }
            logger.info(f"Job {job_id} completed successfully.")
            
        except Exception as e:
            await Orchestrator._fail_job(db, job_id, "internal_error", str(e))
            raise
