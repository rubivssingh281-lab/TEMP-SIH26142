from __future__ import annotations

from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image


def _to_uint8(values: np.ndarray) -> np.ndarray:
    values = np.nan_to_num(values, nan=0.0, posinf=1.0, neginf=0.0)
    return np.clip(values * 255.0, 0, 255).astype(np.uint8)


def rgb_png(channels: np.ndarray) -> bytes:
    """Render B4/B3/B2 channels as an RGB PNG."""
    rgb = _to_uint8(channels[[2, 1, 0]])
    image = Image.fromarray(np.moveaxis(rgb, 0, -1), mode="RGB")
    return _encode(image, "PNG")


def uncertainty_png(uncertainty: np.ndarray) -> bytes:
    """Render uncertainty as a red RGBA overlay."""
    alpha = _to_uint8(uncertainty)
    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    rgba[..., 0] = 255
    rgba[..., 3] = alpha
    return _encode(Image.fromarray(rgba, mode="RGBA"), "PNG")


def enhanced_tiff(channels: np.ndarray) -> bytes:
    """Encode the four output bands in a valid four-sample TIFF container."""
    rgba = _to_uint8(channels)
    image = Image.fromarray(np.moveaxis(rgba, 0, -1), mode="RGBA")
    return _encode(image, "TIFF")


def uncertainty_tiff(uncertainty: np.ndarray) -> bytes:
    image = Image.fromarray(_to_uint8(uncertainty), mode="L")
    return _encode(image, "TIFF")


def _encode(image: Image.Image, format_name: str) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format=format_name)
    return buffer.getvalue()
