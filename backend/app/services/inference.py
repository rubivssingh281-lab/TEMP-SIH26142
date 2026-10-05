from dataclasses import dataclass
from typing import Any, Dict, Protocol

@dataclass
class InferenceConfig:
    model: str
    scale: int = 4
    tile: int = 512
    overlap: int = 64
    n_samples: int = 4
    uncertainty_method: str = "mc_dropout"

@dataclass
class SRResult:
    sr: Any          # np.ndarray: float32 [4, sH, sW]
    uncertainty: Any # np.ndarray: float32 [sH, sW] in [0, 1]
    meta: Dict[str, Any]


class InferenceService(Protocol):
    def predict(self, lr: Any, valid_mask: Any, config: InferenceConfig) -> SRResult:
        ...

class MockInferenceService:
    @staticmethod
    def predict(lr: Any, valid_mask: Any, config: InferenceConfig) -> SRResult:
        import time
        import numpy as np
        # Simulate inference latency
        time.sleep(2)
        
        lr_array = np.asarray(lr, dtype=np.float32)
        mask = np.asarray(valid_mask, dtype=bool)
        sr = np.repeat(np.repeat(lr_array, config.scale, axis=1), config.scale, axis=2)
        uncertainty = np.repeat(np.repeat(~mask, config.scale, axis=0), config.scale, axis=1).astype(np.float32)

        return SRResult(
            sr=np.clip(sr, 0.0, 1.0),
            uncertainty=np.clip(uncertainty, 0.0, 1.0),
            meta={
                "model_version": f"{config.model}_v2.1",
                "calibration_status": "synthetic",
                "thresholds": {"psnr": 30.0, "ssim": 0.85}
            }
        )
