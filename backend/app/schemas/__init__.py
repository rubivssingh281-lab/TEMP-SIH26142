from enum import Enum
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    created = "created"
    queued = "queued"
    preprocessing = "preprocessing"
    inference = "inference"
    postprocessing = "postprocessing"
    validation = "validation"
    done = "done"
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
    health: str
    utilization_pct: int
    trend: list[KpiTrendPoint]

class StorageStatus(BaseModel):
    used_pct: int
    trend: list[KpiTrendPoint]

class SystemStatus(BaseModel):
    gpu_cluster: GpuClusterStatus
    storage: StorageStatus
    api_services: dict
    data_ingestion: dict

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
    state: str
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
    status: str
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
    pass_: bool = Field(alias="pass")

    class Config:
        populate_by_name = True

class ComparisonResponse(BaseModel):
    job_id: str
    lr_image: str
    sr_image: str
    lr_resolution: str
    sr_resolution: str
    coordinate: str
    crops: list[CropArea]
    pixel: dict
    metrics: list[QualityMetric]

# ---------- Validation ----------
class ValidationMetric(BaseModel):
    key: str
    label: str
    value: str
    unit: str
    delta: str
    delta_dir: str
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
    status: str
    reference: str
    evaluated: str

class ValidationResponse(BaseModel):
    job_id: str
    compare_against: str
    validated_at: str
    metrics: list[ValidationMetric]
    metric_trends: list[MetricTrendRow]
    correlation: dict
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
    status: str
    icon: str

class SettingsResponse(BaseModel):
    default_model: ModelType
    models: list[ModelOption]
    target_resolution: str
    bands: dict
    auto_cloud_masking: bool
    uncertainty_map: bool
    gpu_allocation: int
    priority: str
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
