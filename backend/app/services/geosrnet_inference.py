"""GeoSRNet inference service — real super-resolution using the trained model.

Implements the ``InferenceService`` protocol defined in ``inference.py``,
loading the GeoSRNet ×4 CNN from ``Final_Model/`` and running tiled,
MC-Dropout-based inference with feathered blending.

Usage via ``providers.py``::

    INFERENCE_BACKEND=factory
    INFERENCE_FACTORY=app.services.geosrnet_inference:create_geosrnet_service

Environment variables
---------------------
GEOSRNET_CHECKPOINT_PATH : str
    Absolute path to the ``.pth`` checkpoint.
    Default: ``d:\\142_ps\\Final_Model\\GeoSRNet_x4_best.pth``
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict

import numpy as np
import torch
import torch.nn as nn

from app.services.inference import InferenceConfig, SRResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model import — add Final_Model to sys.path so ``geosrnet`` is importable
# ---------------------------------------------------------------------------
_repo_model_dir = Path(__file__).resolve().parents[3] / "Final_Model"
_parent_model_dir = Path(__file__).resolve().parents[4] / "Final_Model"
_FINAL_MODEL_DIR = str(_repo_model_dir if _repo_model_dir.exists() else _parent_model_dir)
if _FINAL_MODEL_DIR not in sys.path:
    sys.path.insert(0, _FINAL_MODEL_DIR)

from geosrnet import GeoSRNet  # noqa: E402  (after sys.path mutation)

# Default checkpoint and evaluation-metrics paths
_DEFAULT_CHECKPOINT = os.path.join(_FINAL_MODEL_DIR, "GeoSRNet_x4_best.pth")
_EVAL_METRICS_PATH = os.path.join(_FINAL_MODEL_DIR, "evaluation_x4.json")


def _select_device() -> torch.device:
    """Auto-detect the best available device (cuda > mps > cpu)."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def _load_eval_metrics() -> Dict[str, Any]:
    """Load pre-computed evaluation metrics from ``evaluation_x4.json``."""
    try:
        with open(_EVAL_METRICS_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("evaluation_x4.json not found at %s", _EVAL_METRICS_PATH)
        return {}


def _build_feather_mask(h: int, w: int, overlap: int) -> np.ndarray:
    """Create a 2-D feathering (blending) weight mask for a tile.

    Edges within ``overlap`` pixels are linearly ramped from 0 → 1 so that
    overlapping tiles blend smoothly.  The centre of the tile has weight 1.

    Returns
    -------
    np.ndarray
        float32 array of shape ``(h, w)`` with values in [0, 1].
    """
    mask = np.ones((h, w), dtype=np.float32)
    if overlap <= 0:
        return mask

    # Vertical ramps
    ramp_v = np.minimum(overlap, h)
    for i in range(ramp_v):
        weight = (i + 1) / (ramp_v + 1)
        mask[i, :] *= weight
        mask[h - 1 - i, :] *= weight

    # Horizontal ramps
    ramp_h = np.minimum(overlap, w)
    for j in range(ramp_h):
        weight = (j + 1) / (ramp_h + 1)
        mask[:, j] *= weight
        mask[:, w - 1 - j] *= weight

    return mask


def _enable_dropout(model: nn.Module) -> None:
    """Switch all ``Dropout`` layers to train mode for MC-Dropout inference."""
    for m in model.modules():
        if isinstance(m, (nn.Dropout, nn.Dropout2d, nn.Dropout3d)):
            m.train()


class GeoSRNetInferenceService:
    """Production inference service backed by the trained GeoSRNet model.

    Parameters
    ----------
    checkpoint_path : str | None
        Path to ``.pth`` file.  Falls back to env var
        ``GEOSRNET_CHECKPOINT_PATH``, then to the default path next to the
        model source.
    device : torch.device | None
        Force a device.  ``None`` → auto-detect.
    """

    def __init__(
        self,
        checkpoint_path: str | None = None,
        device: torch.device | None = None,
    ) -> None:
        self.device = device or _select_device()

        self.checkpoint_path = (
            checkpoint_path
            or os.environ.get("GEOSRNET_CHECKPOINT_PATH", _DEFAULT_CHECKPOINT)
        )
        logger.info(
            "Loading GeoSRNet checkpoint from %s onto %s",
            self.checkpoint_path,
            self.device,
        )

        self.model = GeoSRNet()
        state = torch.load(
            self.checkpoint_path,
            map_location=self.device,
            weights_only=True,
        )
        self.model.load_state_dict(state)
        self.model.to(self.device)
        self.model.eval()

        self._eval_metrics = _load_eval_metrics()
        logger.info("GeoSRNet ready  (eval metrics: %s)", self._eval_metrics)

    # ------------------------------------------------------------------ #
    #  Protocol method                                                    #
    # ------------------------------------------------------------------ #
    def predict(
        self,
        lr: Any,
        valid_mask: Any,
        config: InferenceConfig,
    ) -> SRResult:
        """Run tiled super-resolution with MC-Dropout uncertainty.

        Parameters
        ----------
        lr : array-like
            Low-resolution input of shape ``[4, H, W]``, float32, values in
            [0, 1].
        valid_mask : array-like
            Boolean mask ``[H, W]`` — ``True`` where pixels are valid.
        config : InferenceConfig
            Runtime knobs (tile size, overlap, number of MC samples …).

        Returns
        -------
        SRResult
            ``.sr`` — float32 ``[4, sH, sW]``  (sH = 4*H, sW = 4*W).
            ``.uncertainty`` — float32 ``[sH, sW]`` in [0, 1].
            ``.meta`` — dict with model version, eval metrics, etc.
        """
        lr_np = np.asarray(lr, dtype=np.float32)
        mask_np = np.asarray(valid_mask, dtype=bool)
        scale = config.scale

        # Apply valid_mask: zero out invalid pixels so the model sees clean input
        lr_np = lr_np * mask_np[np.newaxis, :, :]

        _, h, w = lr_np.shape
        sh, sw = h * scale, w * scale

        # ---- tiled inference ----
        sr_accum = np.zeros((4, sh, sw), dtype=np.float64)
        weight_accum = np.zeros((sh, sw), dtype=np.float64)

        tile = config.tile
        overlap = config.overlap
        step = max(tile - overlap, 1)

        for y0 in range(0, h, step):
            for x0 in range(0, w, step):
                y1 = min(y0 + tile, h)
                x1 = min(x0 + tile, w)

                patch_lr = lr_np[:, y0:y1, x0:x1]
                patch_sr = self._run_forward(patch_lr)  # [4, pH*s, pW*s]

                ph, pw = patch_sr.shape[1], patch_sr.shape[2]
                feather = _build_feather_mask(ph, pw, overlap * scale)

                sy0, sx0 = y0 * scale, x0 * scale
                sr_accum[:, sy0:sy0 + ph, sx0:sx0 + pw] += patch_sr * feather[np.newaxis, :, :]
                weight_accum[sy0:sy0 + ph, sx0:sx0 + pw] += feather

        # Normalise by accumulated weights
        weight_accum = np.maximum(weight_accum, 1e-8)
        sr = (sr_accum / weight_accum[np.newaxis, :, :]).astype(np.float32)
        sr = np.clip(sr, 0.0, 1.0)

        # ---- MC-Dropout uncertainty ----
        uncertainty = self._mc_dropout_uncertainty(lr_np, config)

        return SRResult(
            sr=sr,
            uncertainty=uncertainty,
            meta=self._build_meta(config),
        )

    # ------------------------------------------------------------------ #
    #  Internal helpers                                                   #
    # ------------------------------------------------------------------ #
    @torch.no_grad()
    def _run_forward(self, patch: np.ndarray) -> np.ndarray:
        """Single deterministic forward pass on one patch.

        Parameters
        ----------
        patch : np.ndarray
            ``[4, pH, pW]`` float32.

        Returns
        -------
        np.ndarray
            ``[4, pH*4, pW*4]`` float32.
        """
        tensor = torch.from_numpy(patch).unsqueeze(0).to(self.device)
        out = self.model(tensor)
        return out.squeeze(0).cpu().numpy()

    def _mc_dropout_uncertainty(
        self,
        lr_np: np.ndarray,
        config: InferenceConfig,
    ) -> np.ndarray:
        """Estimate per-pixel uncertainty via MC-Dropout.

        Runs ``config.n_samples`` stochastic forward passes with dropout
        layers in train mode, collects predictions, and returns the normalised
        per-pixel variance (mean across bands) as a ``[sH, sW]`` map in [0, 1].
        """
        n_samples = max(config.n_samples, 2)
        scale = config.scale
        _, h, w = lr_np.shape
        sh, sw = h * scale, w * scale

        # Collect stochastic predictions
        samples = np.empty((n_samples, 4, sh, sw), dtype=np.float32)

        # Enable dropout for stochastic forward passes
        _enable_dropout(self.model)

        try:
            tensor = torch.from_numpy(lr_np).unsqueeze(0).to(self.device)
            for i in range(n_samples):
                with torch.no_grad():
                    out = self.model(tensor)
                samples[i] = out.squeeze(0).cpu().numpy()
        finally:
            # Restore full eval mode
            self.model.eval()

        # Per-pixel variance across samples, averaged across bands
        variance = np.var(samples, axis=0).mean(axis=0)  # [sH, sW]

        # Normalise to [0, 1]
        v_max = variance.max()
        if v_max > 0:
            variance = variance / v_max

        return variance.astype(np.float32)

    def _build_meta(self, config: InferenceConfig) -> Dict[str, Any]:
        """Assemble metadata dict for ``SRResult.meta``."""
        return {
            "model_version": "GeoSRNet_x4_v1.0",
            "device": str(self.device),
            "checkpoint": self.checkpoint_path,
            "scale": config.scale,
            "tile": config.tile,
            "overlap": config.overlap,
            "n_mc_samples": config.n_samples,
            "uncertainty_method": config.uncertainty_method,
            "calibration_status": "trained",
            "eval_metrics": self._eval_metrics,
            "thresholds": {
                "psnr": self._eval_metrics.get("model_PSNR", 32.49),
                "ssim": self._eval_metrics.get("model_SSIM", 0.866),
            },
        }


# ---------------------------------------------------------------------- #
#  Factory (used by providers.py via INFERENCE_FACTORY env var)            #
# ---------------------------------------------------------------------- #
def create_geosrnet_service() -> GeoSRNetInferenceService:
    """Factory function importable as ``app.services.geosrnet_inference:create_geosrnet_service``."""
    return GeoSRNetInferenceService()
