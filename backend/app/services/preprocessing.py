from pathlib import Path
from typing import Any, Dict, Protocol, Tuple

import numpy as np


class PreprocessingService(Protocol):
    def process(self, input_bytes: bytes | None) -> Tuple[Any, Any, Dict[str, Any]]:
        ...

class MockPreprocessingService:
    @staticmethod
    def process(input_bytes: bytes | None) -> Tuple[Any, Any, Dict[str, Any]]:
        if input_bytes and len(input_bytes) > 64:
            try:
                from PIL import Image
                from io import BytesIO
                with Image.open(BytesIO(input_bytes)) as pil_img:
                    pil_img = pil_img.convert("RGB")
                    w, h = pil_img.size
                    max_dim = 512
                    if w > max_dim or h > max_dim:
                        pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        w, h = pil_img.size
                    
                    img_np = np.asarray(pil_img, dtype=np.float32) / 255.0
                    # Red, Green, Blue
                    r = img_np[:, :, 0]
                    g = img_np[:, :, 1]
                    b = img_np[:, :, 2]
                    # Synthetic NIR band for 4-band satellite model (Sentinel-2 B2, B3, B4, B8)
                    nir = np.clip(g * 1.15 + (1.0 - r) * 0.15, 0.0, 1.0)
                    # Stack in BGRN order: [B2 (Blue), B3 (Green), B4 (Red), B8 (NIR)]
                    lr_tensor = np.stack([b, g, r, nir], axis=0).astype(np.float32)
                    valid_mask = np.ones((h, w), dtype=bool)
                    
                    mock_meta = {
                        "crs": "EPSG:32643",
                        "transform": [10.0, 0.0, 600000.0, 0.0, -10.0, 3800000.0],
                        "width": w,
                        "height": h,
                        "bands": ["B2", "B3", "B4", "B8"],
                        "bounds": [[34.2, 77.1], [34.3, 77.2]],
                        "georeferenced": False,
                    }
                    return (lr_tensor, valid_mask, mock_meta)
            except Exception as exc:
                pass

        height, width = 64, 64
        y, x = np.mgrid[0:height, 0:width]
        base = (x + y) / float(height + width)
        lr_tensor = np.stack([
            base,
            np.clip(base * 0.8 + 0.1, 0, 1),
            np.clip(1.0 - base * 0.7, 0, 1),
            np.clip(base * 0.6 + 0.2, 0, 1),
        ]).astype(np.float32)
        valid_mask = np.ones((height, width), dtype=bool)

        mock_meta = {
            "crs": "EPSG:32643",
            "transform": [10.0, 0.0, 600000.0, 0.0, -10.0, 3800000.0],
            "width": width,
            "height": height,
            "bands": ["B2", "B3", "B4", "B8"],
            "bounds": [[34.2, 77.1], [34.3, 77.2]],
            "georeferenced": False,
        }
        
        return (lr_tensor, valid_mask, mock_meta)


class RasterioPreprocessingService:
    @staticmethod
    def process(input_bytes: bytes | None) -> Tuple[Any, Any, Dict[str, Any]]:
        if not input_bytes:
            raise ValueError("corrupt_file")

        import rasterio
        from rasterio.io import MemoryFile

        try:
            with MemoryFile(input_bytes) as memory_file:
                with memory_file.open() as dataset:
                    if dataset.crs is None or dataset.crs.is_geographic:
                        raise ValueError("unsupported_crs")
                    if dataset.count < 4:
                        raise ValueError("missing_bands")

                    values = dataset.read(indexes=[1, 2, 3, 4]).astype(np.float32)
                    scales = np.asarray(dataset.scales[:4], dtype=np.float32)
                    offsets = np.asarray(dataset.offsets[:4], dtype=np.float32)
                    scales[scales == 0] = 1.0
                    values = values * scales[:, None, None] + offsets[:, None, None]
                    if np.nanmax(values) > 1.0:
                        values /= 10000.0

                    valid_mask = dataset.read_masks(1) > 0
                    valid_mask &= np.all(np.isfinite(values), axis=0)
                    metadata = {
                        "crs": dataset.crs.to_string(),
                        "transform": list(dataset.transform)[:6],
                        "width": dataset.width,
                        "height": dataset.height,
                        "bands": list(dataset.descriptions[:4]) or ["B2", "B3", "B4", "B8"],
                        "nodata": dataset.nodata,
                        "georeferenced": True,
                    }
                    return np.clip(values, 0.0, 1.0), valid_mask, metadata
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("corrupt_file") from exc
