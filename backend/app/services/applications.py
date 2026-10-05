from __future__ import annotations

from typing import Any, Dict

import numpy as np


class ApplicationService:
    @staticmethod
    def build(sr: Any, job_id: str) -> Dict[str, Dict[str, Any]]:
        values = np.asarray(sr, dtype=np.float32)
        red = values[2]
        nir = values[3]
        ndvi = (nir - red) / (nir + red + 1e-6)
        vegetation = np.clip((ndvi + 1.0) / 2.0, 0.0, 1.0)

        agriculture = {
            "job_id": job_id,
            "application": "agriculture",
            "index": "NDVI",
            "mean_ndvi": round(float(ndvi.mean()), 6),
            "min_ndvi": round(float(ndvi.min()), 6),
            "max_ndvi": round(float(ndvi.max()), 6),
            "vegetated_fraction": round(float(np.mean(ndvi > 0.3)), 6),
        }
        urban = {
            "job_id": job_id,
            "application": "urban",
            "index": "built_up_proxy",
            "mean_built_up_proxy": round(float(1.0 - vegetation.mean()), 6),
        }
        disaster = {
            "job_id": job_id,
            "application": "disaster",
            "index": "vegetation_loss_proxy",
            "low_vegetation_fraction": round(float(np.mean(ndvi < 0.1)), 6),
        }
        return {"agriculture": agriculture, "urban": urban, "disaster": disaster}
