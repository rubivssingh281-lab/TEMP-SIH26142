from typing import Any, Dict, Protocol


class ValidationService(Protocol):
    def compute_metrics(self, sr: Any, lr: Any) -> Dict[str, Any]:
        ...

class MockValidationService:
    @staticmethod
    def compute_metrics(sr: Any, lr: Any) -> Dict[str, Any]:
        import time
        import numpy as np
        # Simulate validation metrics computation latency
        time.sleep(1)

        sr_array = np.asarray(sr, dtype=np.float32)
        lr_array = np.asarray(lr, dtype=np.float32)
        scale = sr_array.shape[1] // lr_array.shape[1]
        downsampled = sr_array[:, ::scale, ::scale]
        mse = float(np.mean((downsampled - lr_array) ** 2))
        psnr = 99.0 if mse == 0 else 10.0 * np.log10(1.0 / mse)
        numerator = float(np.mean((downsampled - downsampled.mean()) * (lr_array - lr_array.mean())))
        denominator = float(downsampled.std() * lr_array.std())
        ssim = (2.0 * numerator + 1e-6) / (denominator + 1e-6)
        dot = np.sum(downsampled * lr_array, axis=0)
        norms = np.linalg.norm(downsampled, axis=0) * np.linalg.norm(lr_array, axis=0)
        sam = np.degrees(np.arccos(np.clip(dot / (norms + 1e-6), -1.0, 1.0)))
        means = np.mean(lr_array, axis=(1, 2))
        rmse = np.sqrt(np.mean((downsampled - lr_array) ** 2, axis=(1, 2)))
        ergas = 100.0 / max(scale, 1) * np.sqrt(np.mean((rmse / (means + 1e-6)) ** 2))
        
        return {
            "psnr": round(psnr, 3),
            "ssim": round(float(np.clip(ssim, -1.0, 1.0)), 4),
            "sam": round(float(np.mean(sam)), 4),
            "ergas": round(float(ergas), 4),
            "lpips": None,
        }
