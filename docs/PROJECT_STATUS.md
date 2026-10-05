# Bhu-Dristi - Project Status Report

**Last updated:** 2026-10-02  
**Scope:** Backend implementation status against `BACKEND_ARCHITECTURE.md` and `BACKEND_PRODUCTION_READINESS.md`.

## Executive Status

The backend is **integration-ready at the API and adapter level**, but it is not yet fully production-certified. Frontend and ML teams now have stable replacement points, while real infrastructure and real geospatial runtime validation remain to be completed.

The current implementation uses the production-oriented stack:

- FastAPI + Uvicorn/Gunicorn
- SQLAlchemy 2.x + PostgreSQL + Alembic
- Celery + Redis
- MinIO/S3 object storage
- Optional OIDC authentication and organization scoping
- Helm deployment resources

The backend's default local mode still uses mock preprocessing and mock inference so development and tests do not require the ML model or live infrastructure.

## Completed

### Core Backend

- [x] FastAPI application with canonical `/api/v1` routes.
- [x] Compatibility `/api` routes for the existing frontend client.
- [x] SQLAlchemy/PostgreSQL ORM models.
- [x] Initial Alembic schema and job-contract migration.
- [x] Job lifecycle states:
  `created`, `queued`, `preprocessing`, `inference`, `postprocessing`, `validation`, `done`, `failed`.
- [x] Persisted stage, progress, errors, metrics, calibration status, validation level, and result metadata.
- [x] Celery worker configuration with late acknowledgements, single-worker execution, retries, and task time limits.
- [x] Startup recovery that marks interrupted non-terminal jobs as `failed/interrupted`.
- [x] Dependency-aware `/readyz` implementation and `/healthz` endpoint.

### Storage and Uploads

- [x] MinIO/S3 object-storage adapter with lazy bucket initialization.
- [x] Fixed UUID-derived input key: `input/original.tif`.
- [x] Upload byte-size, pixel-count, band-count, TIFF-format, and TIFF-structure checks.
- [x] Cleanup of uploaded objects when database persistence fails.
- [x] Export bundle generation for output artifacts, metrics, and manifest.

### Processing and Results

- [x] Typed provider seams for preprocessing, inference, and validation.
- [x] Configurable ML factory through `INFERENCE_BACKEND` and `INFERENCE_FACTORY`.
- [x] Real input-object read flow from storage into preprocessing.
- [x] Valid PNG previews and TIFF artifacts in mock mode.
- [x] Computed PSNR, SSIM, SAM, and ERGAS metrics.
- [x] Explicit `null` for unavailable LPIPS values.
- [x] NDVI/agriculture, urban, and disaster application JSON outputs.
- [x] Manifest-derived bounds, confidence summary, calibration status, and validation provenance.
- [x] Integration contract documentation in `backend/INTEGRATION_CONTRACTS.md`.

### Security and Observability Foundation

- [x] Restrictive default CORS origins.
- [x] Request trace IDs through `X-Trace-ID`.
- [x] Standard error envelope containing `error_code`, `message`, and `trace_id`.
- [x] Security response headers.
- [x] Prometheus request counters, duration metrics, and `/metrics` endpoint.
- [x] Optional OIDC/JWT authentication boundary.
- [x] Organization and owner fields with tenant-scoped job queries when authentication is enabled.

### Tests and Deployment Scaffold

- [x] Corrected stale PDF test imports.
- [x] 12 passing backend unit/integration tests in the bundled environment.
- [x] Tests cover API health, trace IDs, metrics, auth boundary, upload rejection, artifact publication, application outputs, manifest confidence, and report generation.
- [x] Docker Compose configuration validates successfully.
- [x] Helm templates for API, worker, service, and migration Job.
- [x] Helm values for geospatial mode, ML provider, authentication, and OIDC configuration.

## Pending for Complete Backend

### 1. Real GeoTIFF Runtime Validation - Highest Priority

The rasterio-backed implementation exists but has not yet been executed locally because the rasterio wheel installation was interrupted.

Required before marking complete:

- [ ] Install rasterio successfully in the development environment and Docker image.
- [ ] Process a real projected Sentinel-2 sample.
- [ ] Confirm B2/B3/B4/B8 band ordering and reflectance scaling.
- [ ] Reject geographic CRS inputs with `unsupported_crs`.
- [ ] Verify output CRS, nodata, bounds, and affine transform.
- [ ] Verify output transform is scaled by `1/4` around the same top-left origin.
- [ ] Open the exported GeoTIFF in QGIS or rasterio.
- [ ] Confirm memory-bounded tiled processing for large scenes.

Relevant replacement points:

- `backend/app/services/preprocessing.py`
- `backend/app/services/geospatial.py`
- `backend/app/services/providers.py`

### 2. Real ML Integration

The backend contract is ready, but the actual model implementation is external.

The ML team must provide:

```text
INFERENCE_BACKEND=production
INFERENCE_FACTORY=package.module:create_service
```

The factory must return an implementation of:

```python
predict(lr, valid_mask, config) -> SRResult
```

Required ML completion items:

- [ ] Load the checkpoint once per worker.
- [ ] Implement tiled inference with overlap handling.
- [ ] Return `[4, scale*H, scale*W]` float32 SR output.
- [ ] Return aligned uncertainty values in `[0, 1]`.
- [ ] Return `model_version`, calibration status, thresholds, and reproducibility metadata.
- [ ] Add model contract tests using the backend's `SRResult` type.

### 3. Live Infrastructure Integration

Local tests currently use fakes for external services.

Required:

- [ ] Start Postgres, Redis, MinIO, API, and Celery with Docker Compose.
- [ ] Run `alembic upgrade head` against live Postgres.
- [ ] Upload and process a real sample through the API.
- [ ] Verify Celery consumes the job and persists all artifacts.
- [ ] Verify MinIO presigned preview access.
- [ ] Verify export ZIP contents and GeoTIFF readability.
- [ ] Test worker failure, retry, timeout, and restart recovery.

### 4. Production Deployment Hardening

The Helm chart is a deployment scaffold, not yet a complete production chart.

Required:

- [ ] Install Helm and run `helm lint` and `helm template`.
- [ ] Add Kubernetes Secrets for database, MinIO, Redis, and OIDC credentials.
- [ ] Add TLS Ingress and API gateway configuration.
- [ ] Add NetworkPolicies, PodDisruptionBudgets, security contexts, and non-root containers.
- [ ] Add GPU node selectors, tolerations, and worker resource policies.
- [ ] Add HPA/KEDA queue-based autoscaling.
- [ ] Add migration ordering and rollback verification.
- [ ] Add Prometheus ServiceMonitor, alerts, and dashboards.
- [ ] Pin Docker base images and dependency versions.

### 5. Security and Governance Completion

The authentication boundary is present, but production identity integration is not complete.

Required:

- [ ] Connect and test against the real Keycloak/OIDC issuer.
- [ ] Define viewer, analyst, and admin RBAC policies.
- [ ] Enforce tenant scoping on every repository query and object-storage path.
- [ ] Add append-only audit records for create, run, download, and delete operations.
- [ ] Add rate limiting and idempotency keys.
- [ ] Move all credentials to a secrets manager.
- [ ] Add upload driver allowlisting and sandboxed decompression.
- [ ] Add retention, deletion, classification, and backup policies.

### 6. Frontend Contract Completion

The backend exposes both `/api/v1` and `/api` compatibility paths, but the frontend must be aligned with the canonical contract.

Required:

- [ ] Update frontend types to use `done`, `inference`, `preprocessing`, and other canonical states.
- [ ] Bind frontend result views to manifest-derived bounds and confidence values.
- [ ] Display `calibration_status` and `validation_level` honestly.
- [ ] Test upload, polling, previews, applications, metrics, and export against the live backend.

## Definition of Backend Complete

The backend can be considered complete for frontend/ML handoff when all of the following pass:

1. A real projected Sentinel-2 GeoTIFF completes through the API.
2. The ML provider can be replaced through `INFERENCE_FACTORY` only.
3. The output GeoTIFF opens in QGIS and preserves correct CRS and transform.
4. Metrics, uncertainty, applications, previews, manifest, and export are all real and aligned.
5. Two concurrent jobs execute safely and remain isolated by job and organization.
6. Worker failure and service restart recover predictably.
7. Docker Compose live integration tests pass.
8. Helm lint/template and deployment smoke tests pass.
9. OIDC, RBAC, tenant isolation, secrets, and audit behavior pass security tests.
10. Frontend contract tests pass against `/api/v1`.

## Current Handoff Assessment

**Suitable now:** frontend development, mock end-to-end flow, API contract integration, ML adapter development, and local automated testing.

**Not yet certified:** real scientific GeoTIFF processing, live infrastructure operation, production Kubernetes deployment, and government-grade identity/security controls.
