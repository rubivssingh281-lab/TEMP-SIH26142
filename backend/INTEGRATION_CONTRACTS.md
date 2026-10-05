# Backend Integration Contracts

The API routes and orchestrator are stable. External implementations replace providers through configuration; they should not modify routes or database lifecycle code.

## Geospatial provider

Set `USE_REAL_GEOSPATIAL=true` to use `RasterioPreprocessingService`.

The provider receives the uploaded GeoTIFF bytes and returns:

```text
lr: float32 [4, H, W] in [0, 1]       # B2, B3, B4, B8
valid_mask: bool [H, W]
metadata: {
  crs: str,
  transform: [a, b, c, d, e, f],
  width: int,
  height: int,
  bands: list[str],
  nodata: number | null,
  georeferenced: bool,
}
```

The production provider must reject geographic CRS inputs and preserve the projected CRS and input top-left origin. Output dimensions must be exactly `scale * input dimensions`.

## ML provider

Set `INFERENCE_BACKEND=production` and `INFERENCE_FACTORY=package.module:create_service`.

The factory must return an object implementing:

```python
predict(lr, valid_mask, config) -> SRResult
```

`SRResult` contains:

```text
sr: float32 [4, scale*H, scale*W] in [0, 1]
uncertainty: float32 [scale*H, scale*W] in [0, 1]
meta: {
  model_version: str,
  calibration_status: not_evaluated | failed_check | provisional | calibrated,
  thresholds: dict,
}
```

The model should be loaded once by the factory, not once per job. The worker serializes model execution per GPU worker.

## Validation provider

Replace `get_validation_service()` in `app/services/providers.py` with the scientific validation implementation when high-resolution references are available. It must return JSON-serializable metric values and explicitly use `null` for metrics that cannot be computed for a run.

## Completion artifacts

A successful job publishes:

```text
output/enhanced.tif
output/uncertainty.tif
preview/original.png
preview/enhanced.png
preview/uncertainty.png
metrics.json
applications/agriculture.json
applications/urban.json
applications/disaster.json
manifest.json
```

The frontend should consume `/api/v1/jobs/{job_id}/results` and should never decode GeoTIFFs in the browser.
