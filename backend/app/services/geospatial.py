from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, Tuple

import numpy as np


def georeferenced_tiffs(
    sr: np.ndarray,
    uncertainty: np.ndarray,
    metadata: Dict[str, Any],
    scale: int,
) -> Tuple[bytes, bytes, list[list[float]]]:
    """Write aligned GeoTIFFs and return WGS84 bounds for map placement."""
    import rasterio
    from rasterio.io import MemoryFile
    from rasterio.transform import Affine
    from rasterio.warp import transform_bounds

    transform = Affine(*metadata["transform"]) * Affine.scale(1 / scale)
    width, height = sr.shape[2], sr.shape[1]
    profile = {
        "driver": "GTiff",
        "height": height,
        "width": width,
        "count": sr.shape[0],
        "dtype": "float32",
        "crs": metadata["crs"],
        "transform": transform,
        "compress": "deflate",
    }

    with MemoryFile() as enhanced_memory:
        with enhanced_memory.open(**profile) as dataset:
            dataset.write(np.asarray(sr, dtype=np.float32))
        enhanced_bytes = enhanced_memory.read()

    uncertainty_profile = {**profile, "count": 1}
    with MemoryFile() as uncertainty_memory:
        with uncertainty_memory.open(**uncertainty_profile) as dataset:
            dataset.write(np.asarray(uncertainty, dtype=np.float32), 1)
        uncertainty_bytes = uncertainty_memory.read()

    left, bottom, right, top = rasterio.transform.array_bounds(height, width, transform)
    west, south, east, north = transform_bounds(metadata["crs"], "EPSG:4326", left, bottom, right, top)
    bounds = [[south, west], [north, east]]
    return enhanced_bytes, uncertainty_bytes, bounds