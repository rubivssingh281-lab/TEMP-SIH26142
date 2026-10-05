# TerraSharp Atlas — FastAPI Integration Contract

This document is the **single source of truth** for the API the frontend expects.
The Next.js app ships with built-in mock routes (`frontend/src/app/api/*`) that
already return these exact shapes. To integrate a real FastAPI backend:

1. Implement the endpoints below (same paths, same JSON shapes).
2. Enable CORS for the frontend origin.
3. In the frontend, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` (see
   `frontend/.env.local.example`).

That's it — the frontend's typed client (`frontend/src/lib/api.ts`) will then send
every request to `${NEXT_PUBLIC_API_BASE_URL}/api/...` instead of the local mocks.
No frontend code changes required.

> **Base path:** every endpoint is served under `/api`. The client builds
> `` `${BASE}/api${path}` `` when `NEXT_PUBLIC_API_BASE_URL` is set, and `/api${path}`
> (same-origin Next.js routes) when it isn't.

---

## Endpoints

| Method | Path                       | Frontend caller            | Response type        |
| ------ | -------------------------- | -------------------------- | -------------------- |
| GET    | `/api/dashboard`           | `api.getDashboard()`       | `DashboardResponse`  |
| GET    | `/api/queue`               | `api.getQueue(params)`     | `QueueResponse`      |
| GET    | `/api/projects`            | `api.getProjects(params)`  | `ProjectsResponse`   |
| GET    | `/api/comparison/{job_id}` | `api.getComparison(id)`    | `ComparisonResponse` |
| GET    | `/api/validation/{job_id}` | `api.getValidation(id)`    | `ValidationResponse` |
| GET    | `/api/settings`            | `api.getSettings()`        | `SettingsResponse`   |
| PUT    | `/api/settings`            | `api.saveSettings(body)`   | `SettingsResponse`   |
| POST   | `/api/jobs`                | `api.submitJob(body)`      | `{ job_id, status }` |
| POST   | `/api/jobs/estimate`       | `api.estimateJob(body)`    | `NewJobEstimate`     |
| GET    | `/api/reports/validation/{job_id}` | `api.reports.validation(id)` | `application/pdf` |
| GET    | `/api/reports/comparison/{job_id}` | `api.reports.comparison(id)` | `application/pdf` |
| GET    | `/api/reports/job/{job_id}`        | `api.reports.job(id)`        | `application/pdf` |
| GET    | `/api/reports/invoice/{id}`        | `api.reports.invoice(id)`    | `application/pdf` |

### Report endpoints (downloadable PDFs)

The Export buttons (Validation → *Export Report (PDF)*, Comparison → *Export
Snapshot*, Queue → per-row download, Settings → invoice download) fetch these and
save the blob. Each returns raw `application/pdf` bytes with a
`Content-Disposition: attachment` header — **not** JSON. The invoice route accepts
optional `?amount=<inr>&date=<str>` query params. A reference implementation
(dependency-free PDF writer, no reportlab) lives in
[`backend/`](./backend/README.md); the Next.js mock routes under
`frontend/src/app/api/reports/*` generate the same documents.

### Query parameters

- `GET /api/queue` — `page`, `status` (`processing`\|`queued`\|`completed`\|`failed`),
  `project`, `q` (search by Job ID / project).
- `GET /api/projects` — `category` (`All`\|`Active`\|`Archived`\| a category name),
  `q` (search), `sort` (`recent`\|`name`\|`area`).

### Image fields

Every `*_image`, `*_thumb`, `cover_image`, and crop `image` field is a **seed
string** (e.g. `"ladakh-urban"`), not a URL. The frontend renders procedural
satellite textures / heatmaps from the seed, so no image hosting is needed for the
demo. When you have real imagery, return absolute URLs instead and swap
`SatelliteTile`/`HeatmapTile` for `<img>` in the components — the data contract is
otherwise unchanged.

---

## Pydantic schemas (FastAPI)

These mirror `frontend/src/lib/types.ts` one-to-one. Drop them into your backend.

```python
from enum import Enum
from pydantic import BaseModel


class JobStatus(str, Enum):
    completed = "completed"
    processing = "processing"
    queued = "queued"
    failed = "failed"


class ModelType(str, Enum):
    gan = "gan"
    diffusion = "diffusion"
    transformer = "transformer"
    cnn = "cnn"


class MetricRating(str, Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"


class KpiTrendPoint(BaseModel):
    t: str
    v: float


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_jobs: int
    completed_jobs: int
    processing_jobs: int
    completed_this_month: int
    storage_used_tb: float
    storage_total_tb: float


class GpuClusterStatus(BaseModel):
    health: str            # healthy | degraded | down
    utilization_pct: int
    trend: list[KpiTrendPoint]


class StorageStatus(BaseModel):
    used_pct: int
    trend: list[KpiTrendPoint]


class SystemStatus(BaseModel):
    gpu_cluster: GpuClusterStatus
    storage: StorageStatus
    api_services: dict          # {"status": "operational"}
    data_ingestion: dict        # {"status": "active"}


class JobSummary(BaseModel):
    job_id: str
    project: str
    status: JobStatus
    date: str
    resolution_gain: str
    progress: int | None = None
    compute_node: str | None = None
    gpu: str | None = None
    started: str | None = None
    eta: str | None = None
    lr_thumb: str | None = None
    sr_thumb: str | None = None


class RecentJobPreview(BaseModel):
    job_id: str
    status: JobStatus
    area_km2: float
    location: str
    acquisition_date: str
    model: str
    resolution_gain: str
    lr_image: str
    sr_image: str
    uncertainty_image: str
    lr_resolution: str
    sr_resolution: str


class DashboardResponse(BaseModel):
    stats: DashboardStats
    system_status: SystemStatus
    recent_job: RecentJobPreview
    recent_jobs: list[JobSummary]
    last_updated: str


# ---------- Queue ----------
class JobStageProgress(BaseModel):
    name: str
    state: str                  # completed | in_progress | pending
    detail: str
    progress: int | None = None


class JobDetail(JobSummary):
    stages: list[JobStageProgress] = []
    tiles_processed: int = 0
    tiles_total: int = 0
    throughput_mbps: float = 0


class QueueStats(BaseModel):
    queued: int
    processing: int
    avg_progress_pct: int
    completed_today: int
    failed: int


class GpuNode(BaseModel):
    name: str
    utilization_pct: int


class ClusterLoad(BaseModel):
    health: str
    overall_utilization_pct: int
    trend: list[KpiTrendPoint]
    nodes: list[GpuNode]


class QueueResponse(BaseModel):
    stats: QueueStats
    jobs: list[JobDetail]
    cluster: ClusterLoad
    total: int
    page: int
    rows_per_page: int


# ---------- Projects ----------
class TeamMember(BaseModel):
    initials: str
    name: str
    color: str


class JobRunDot(BaseModel):
    date: str
    status: JobStatus


class Project(BaseModel):
    id: str
    name: str
    status: str                 # active | archived
    category: str
    description: str
    jobs: int
    last_updated: str
    total_area_km2: float
    complete_pct: int
    cover_image: str
    recent_runs: list[JobRunDot] = []
    team: list[TeamMember] = []


class ProjectsResponse(BaseModel):
    projects: list[Project]
    total: int
    page: int


# ---------- Comparison ----------
class CropArea(BaseModel):
    id: str
    label: str
    sub: str
    image: str


class PixelBand(BaseModel):
    band: str
    reflectance: float


class QualityMetric(BaseModel):
    key: str
    label: str
    value: str
    threshold: str
    pass_: bool  # serialize as "pass" (use Field(alias="pass"))


class ComparisonResponse(BaseModel):
    job_id: str
    lr_image: str
    sr_image: str
    lr_resolution: str
    sr_resolution: str
    coordinate: str
    crops: list[CropArea]
    pixel: dict                 # {coordinate, bands: [PixelBand], valid: bool}
    metrics: list[QualityMetric]


# ---------- Validation ----------
class ValidationMetric(BaseModel):
    key: str
    label: str
    value: str
    unit: str
    delta: str
    delta_dir: str              # up | down
    rating: MetricRating
    trend: list[KpiTrendPoint]


class MetricTrendRow(BaseModel):
    run: str
    psnr: float
    ssim: float
    sam: float
    ergas: float
    lpips: float


class TaskValidationRow(BaseModel):
    task: str
    metric: str
    result: float
    status: str                 # pass | fail
    reference: str
    evaluated: str


class ValidationResponse(BaseModel):
    job_id: str
    compare_against: str
    validated_at: str
    metrics: list[ValidationMetric]
    metric_trends: list[MetricTrendRow]
    correlation: dict           # {r: float, points: [{uncertainty, error}]}
    tasks: list[TaskValidationRow]


# ---------- Settings ----------
class ModelOption(BaseModel):
    key: ModelType
    name: str
    description: str
    avg_time: str
    accuracy: MetricRating


class DataSource(BaseModel):
    id: str
    name: str
    detail: str
    status: str                 # connected | disconnected
    icon: str


class SettingsResponse(BaseModel):
    default_model: ModelType
    models: list[ModelOption]
    target_resolution: str
    bands: dict                 # {rgb, nir, swir: bool}
    auto_cloud_masking: bool
    uncertainty_map: bool
    gpu_allocation: int
    priority: str               # standard | high
    estimated_cost_inr: float
    data_sources: list[DataSource]


# ---------- New Job ----------
class NewJobPayload(BaseModel):
    project: str
    job_name: str
    satellite_source: str
    model: ModelType
    target_resolution_m: float
    bands: list[str]
    aoi_coordinates: list[list[float]]


class NewJobEstimate(BaseModel):
    area_km2: float
    estimated_time: str
    estimated_storage_gb: float
```

> **Note on `pass`:** `pass` is a Python keyword. In the `QualityMetric` schema use
> `pass_: bool = Field(alias="pass")` with `populate_by_name=True` so it serializes
> as `"pass"` in JSON (which is what the frontend reads).

---

## Minimal FastAPI stub

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TerraSharp Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/dashboard", response_model=DashboardResponse)
def dashboard():
    ...  # return a DashboardResponse


@app.get("/api/queue", response_model=QueueResponse)
def queue(page: int = 1, status: str | None = None,
          project: str | None = None, q: str | None = None):
    ...


@app.get("/api/comparison/{job_id}", response_model=ComparisonResponse)
def comparison(job_id: str):
    ...

# ...and so on for the remaining endpoints in the table above.
```

To confirm the shapes, run the Next.js app on its mock routes and inspect the
responses (e.g. `curl http://localhost:3000/api/dashboard`) — match those exactly.
