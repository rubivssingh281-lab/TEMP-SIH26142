"""Real validation service — computes image-quality and spectral metrics.

Implements the ``ValidationService`` protocol defined in ``validation.py``.
Since paired high-resolution ground truth is unavailable at runtime, metrics
are computed via **self-consistency**: the SR output is down-sampled back to
the LR resolution and compared against the original LR input.

Metrics computed
----------------
* **PSNR** — Peak Signal-to-Noise Ratio (dB)
* **SSIM** — Structural Similarity Index (per-band, then averaged)
* **SAM**  — Spectral Angle Mapper (degrees, per-pixel mean)
* **ERGAS** — Erreur Relative Globale Adimensionnelle de Synthèse
* **NDVI consistency** — RMSE between NDVI of down-sampled SR and NDVI of LR
"""

from __future__ import annotations

import logging
from typing import Any, Dict

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Try to use scikit-image for SSIM when available; fall back to a manual
# implementation otherwise.
# ---------------------------------------------------------------------------
_HAS_SKIMAGE = False
try:
    from skimage.metrics import structural_similarity as _sk_ssim  # type: ignore[import-untyped]
    _HAS_SKIMAGE = True
except ImportError:
    pass


# ======================================================================== #
#  Pure-NumPy metric helpers                                                #
# ======================================================================== #

def _psnr(ref: np.ndarray, test: np.ndarray, data_range: float = 1.0) -> float:
    """Peak Signal-to-Noise Ratio (higher is better).

    Parameters
    ----------
    ref, test : np.ndarray
        Arrays of the same shape (any number of dimensions).
    data_range : float
        Dynamic range of the data (1.0 for [0, 1] normalised images).
    """
    mse = float(np.mean((ref.astype(np.float64) - test.astype(np.float64)) ** 2))
    if mse == 0.0:
        return 99.0  # perfect reconstruction cap
    return float(10.0 * np.log10(data_range ** 2 / mse))


def _ssim_manual(
    ref: np.ndarray,
    test: np.ndarray,
    data_range: float = 1.0,
    *,
    k1: float = 0.01,
    k2: float = 0.03,
) -> float:
    """Mean SSIM over all bands using the simplified global-statistics formula.

    This is a lightweight fallback when ``skimage`` is not installed.  It
    computes per-band SSIM using image-wide means and variances (Wang et al.,
    2004, Eq. 13 simplified) and returns their average.

    Parameters
    ----------
    ref, test : np.ndarray
        ``[C, H, W]`` float arrays.
    data_range : float
        Dynamic range.
    """
    c1 = (k1 * data_range) ** 2
    c2 = (k2 * data_range) ** 2

    ref64 = ref.astype(np.float64)
    test64 = test.astype(np.float64)

    n_bands = ref64.shape[0]
    band_ssim: list[float] = []

    for b in range(n_bands):
        mu_r = ref64[b].mean()
        mu_t = test64[b].mean()
        sigma_r = ref64[b].var()
        sigma_t = test64[b].var()
        sigma_rt = ((ref64[b] - mu_r) * (test64[b] - mu_t)).mean()

        num = (2.0 * mu_r * mu_t + c1) * (2.0 * sigma_rt + c2)
        den = (mu_r ** 2 + mu_t ** 2 + c1) * (sigma_r + sigma_t + c2)
        band_ssim.append(float(num / den))

    return float(np.mean(band_ssim))


def _ssim(ref: np.ndarray, test: np.ndarray, data_range: float = 1.0) -> float:
    """Compute SSIM, preferring scikit-image when available.

    Parameters
    ----------
    ref, test : np.ndarray
        ``[C, H, W]`` float32 arrays.
    """
    if _HAS_SKIMAGE:
        # skimage expects (H, W) or (H, W, C), so transpose [C,H,W] → [H,W,C]
        ref_hwc = np.moveaxis(ref, 0, -1)
        test_hwc = np.moveaxis(test, 0, -1)
        return float(
            _sk_ssim(
                ref_hwc,
                test_hwc,
                data_range=data_range,
                channel_axis=-1,
            )
        )
    return _ssim_manual(ref, test, data_range=data_range)


def _sam(ref: np.ndarray, test: np.ndarray) -> float:
    """Spectral Angle Mapper — mean angle in **degrees** (lower is better).

    Parameters
    ----------
    ref, test : np.ndarray
        ``[C, H, W]`` spectral images (C bands).
    """
    # Dot product along bands  → [H, W]
    dot = np.sum(ref.astype(np.float64) * test.astype(np.float64), axis=0)
    norm_ref = np.linalg.norm(ref.astype(np.float64), axis=0)
    norm_test = np.linalg.norm(test.astype(np.float64), axis=0)
    cos_theta = dot / (norm_ref * norm_test + 1e-10)
    angle_rad = np.arccos(np.clip(cos_theta, -1.0, 1.0))
    return float(np.degrees(angle_rad).mean())


def _ergas(
    ref: np.ndarray,
    test: np.ndarray,
    scale: int,
) -> float:
    """Erreur Relative Globale Adimensionnelle de Synthèse (lower is better).

    Parameters
    ----------
    ref, test : np.ndarray
        ``[C, H, W]`` — reference and test images at the same resolution.
    scale : int
        Spatial resolution ratio (e.g. 4 for ×4 SR).
    """
    ref64 = ref.astype(np.float64)
    test64 = test.astype(np.float64)

    n_bands = ref64.shape[0]
    sum_sq = 0.0
    for b in range(n_bands):
        rmse_b = np.sqrt(np.mean((ref64[b] - test64[b]) ** 2))
        mean_b = ref64[b].mean()
        sum_sq += (rmse_b / (mean_b + 1e-10)) ** 2

    return float(100.0 / max(scale, 1) * np.sqrt(sum_sq / n_bands))


def _ndvi(bands: np.ndarray) -> np.ndarray:
    """Compute NDVI from a 4-band Sentinel-2 stack [B2, B3, B4, B8].

    NDVI = (B8 − B4) / (B8 + B4)

    Parameters
    ----------
    bands : np.ndarray
        ``[4, H, W]`` — band order B2, B3, B4, B8.

    Returns
    -------
    np.ndarray
        ``[H, W]`` NDVI map in [-1, 1].
    """
    nir = bands[3].astype(np.float64)   # B8
    red = bands[2].astype(np.float64)   # B4
    return (nir - red) / (nir + red + 1e-10)


def _ndvi_consistency(sr: np.ndarray, lr: np.ndarray, scale: int) -> float:
    """NDVI consistency RMSE between down-sampled SR and original LR.

    Parameters
    ----------
    sr : np.ndarray
        ``[4, sH, sW]`` super-resolved image.
    lr : np.ndarray
        ``[4, H, W]`` original low-resolution image.
    scale : int
        Spatial resolution ratio.

    Returns
    -------
    float
        RMSE between the two NDVI maps (lower is better).
    """
    # Down-sample SR to LR resolution via area averaging
    _, sh, sw = sr.shape
    h, w = sh // scale, sw // scale
    # Reshape → average blocks of (scale × scale)
    sr_ds = sr[:, :h * scale, :w * scale].reshape(4, h, scale, w, scale).mean(axis=(2, 4))
    ndvi_sr = _ndvi(sr_ds)
    ndvi_lr = _ndvi(lr[:, :h, :w])
    return float(np.sqrt(np.mean((ndvi_sr - ndvi_lr) ** 2)))


# ======================================================================== #
#  Service class                                                            #
# ======================================================================== #

class RealValidationService:
    """Validation service computing real image-quality and spectral metrics.

    Follows the ``ValidationService`` protocol::

        def compute_metrics(self, sr, lr) -> Dict[str, Any]: ...

    Because paired HR ground truth is unavailable at inference time, all
    spatial metrics are **self-consistency** metrics: the SR image is
    down-sampled to the LR grid and compared against the original LR.
    """

    @staticmethod
    def compute_metrics(sr: Any, lr: Any) -> Dict[str, Any]:
        """Compute quality metrics between SR output and LR input.

        Parameters
        ----------
        sr : array-like
            Super-resolved image ``[4, sH, sW]``, float32, [0, 1].
        lr : array-like
            Low-resolution input ``[4, H, W]``, float32, [0, 1].

        Returns
        -------
        dict
            Keys: ``psnr``, ``ssim``, ``sam``, ``ergas``,
            ``ndvi_consistency_rmse``, ``lpips``, ``method``.
        """
        sr_np = np.asarray(sr, dtype=np.float32)
        lr_np = np.asarray(lr, dtype=np.float32)

        # Infer spatial scale factor
        scale = sr_np.shape[1] // lr_np.shape[1]

        # Down-sample SR to LR resolution via block averaging
        _, sh, sw = sr_np.shape
        h, w = sh // scale, sw // scale
        sr_ds = (
            sr_np[:, :h * scale, :w * scale]
            .reshape(4, h, scale, w, scale)
            .mean(axis=(2, 4))
            .astype(np.float32)
        )

        # Clip LR to the corresponding region (in case of rounding)
        lr_crop = lr_np[:, :h, :w]

        psnr = _psnr(lr_crop, sr_ds)
        ssim = _ssim(lr_crop, sr_ds)
        sam = _sam(lr_crop, sr_ds)
        ergas = _ergas(lr_crop, sr_ds, scale)
        ndvi_rmse = _ndvi_consistency(sr_np, lr_np, scale)

        logger.info(
            "Validation  PSNR=%.3f  SSIM=%.4f  SAM=%.4f°  ERGAS=%.4f  NDVI-RMSE=%.6f",
            psnr, ssim, sam, ergas, ndvi_rmse,
        )

        return {
            "psnr": round(psnr, 3),
            "ssim": round(float(np.clip(ssim, -1.0, 1.0)), 4),
            "sam": round(sam, 4),
            "ergas": round(ergas, 4),
            "ndvi_consistency_rmse": round(ndvi_rmse, 6),
            "lpips": None,  # requires a separate perceptual model; left as None
            "method": "self_consistency",
        }
