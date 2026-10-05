/**
 * भू DRISTI (Bhu DRISTI) — API data models.
 *
 * These TypeScript interfaces mirror the Pydantic schemas expected from the
 * FastAPI backend (see ../FASTAPI_CONTRACT.md). Both the built-in mock API
 * routes and a real FastAPI backend must serialize to these exact shapes so the
 * frontend integrates with either without code changes.
 */

export type JobStatus = "completed" | "processing" | "queued" | "failed" | "created" | "preprocessing" | "inference" | "postprocessing" | "validation" | "done";
export type ProjectStatus = "active" | "archived";
export type ModelType = "gan" | "diffusion" | "transformer" | "cnn";
export type MetricRating = "excellent" | "good" | "fair" | "poor";
export type SystemHealth = "healthy" | "degraded" | "down";

export interface KpiTrendPoint {
  t: string; // ISO-ish label
  v: number;
}

/* ------------------------------------------------------------------ Dashboard */

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_jobs: number;
  completed_jobs: number;
  processing_jobs: number;
  completed_this_month: number;
  storage_used_tb: number;
  storage_total_tb: number;
}

export interface SystemStatus {
  gpu_cluster: { health: SystemHealth; utilization_pct: number; trend: KpiTrendPoint[] };
  storage: { used_pct: number; trend: KpiTrendPoint[] };
  api_services: { status: "operational" | "down" };
  data_ingestion: { status: "active" | "inactive" };
}

export interface RecentJobPreview {
  job_id: string;
  status: JobStatus;
  area_km2: number;
  location: string;
  acquisition_date: string;
  model: string;
  resolution_gain: string;
  lr_image: string;
  sr_image: string;
  uncertainty_image: string;
  lr_resolution: string;
  sr_resolution: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  system_status: SystemStatus;
  recent_job: RecentJobPreview;
  recent_jobs: JobSummary[];
  last_updated: string;
}

/* ----------------------------------------------------------------------- Jobs */

export interface JobStageProgress {
  name: string;
  state: "completed" | "in_progress" | "pending";
  detail: string;
  progress?: number;
}

export interface JobSummary {
  job_id: string;
  project: string;
  status: JobStatus;
  date: string;
  resolution_gain: string;
  progress?: number;
  compute_node?: string;
  gpu?: string;
  started?: string;
  eta?: string;
  lr_thumb?: string;
  sr_thumb?: string;
}

export interface JobDetail extends JobSummary {
  stages: JobStageProgress[];
  tiles_processed: number;
  tiles_total: number;
  throughput_mbps: number;
}

export interface QueueStats {
  queued: number;
  processing: number;
  avg_progress_pct: number;
  completed_today: number;
  failed: number;
}

export interface GpuNode {
  name: string;
  utilization_pct: number;
}

export interface ClusterLoad {
  health: SystemHealth;
  overall_utilization_pct: number;
  trend: KpiTrendPoint[];
  nodes: GpuNode[];
}

export interface QueueResponse {
  stats: QueueStats;
  jobs: JobDetail[];
  cluster: ClusterLoad;
  total: number;
  page: number;
  rows_per_page: number;
}

/* ------------------------------------------------------------------- Projects */

export interface TeamMember {
  initials: string;
  name: string;
  color: string;
}

export interface JobRunDot {
  date: string;
  status: JobStatus;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  category: string;
  description: string;
  jobs: number;
  last_updated: string;
  total_area_km2: number;
  complete_pct: number;
  cover_image: string;
  recent_runs: JobRunDot[];
  team: TeamMember[];
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
}

/* ----------------------------------------------------------- Comparison Viewer */

export interface CropArea {
  id: string;
  label: string;
  sub: string;
  image: string;
}

export interface PixelBand {
  band: string;
  reflectance: number;
}

export interface QualityMetric {
  key: string;
  label: string;
  value: string;
  threshold: string;
  pass: boolean;
}

export interface ComparisonResponse {
  job_id: string;
  lr_image: string;
  sr_image: string;
  lr_resolution: string;
  sr_resolution: string;
  coordinate: string;
  crops: CropArea[];
  pixel: { coordinate: string; bands: PixelBand[]; valid: boolean };
  metrics: QualityMetric[];
}

/* --------------------------------------------------------- Validation Reports */

export interface ValidationMetric {
  key: string;
  label: string;
  value: string;
  unit: string;
  delta: string;
  delta_dir: "up" | "down";
  rating: MetricRating;
  trend: KpiTrendPoint[];
}

export interface MetricTrendRow {
  run: string;
  psnr: number;
  ssim: number;
  sam: number;
  ergas: number;
  lpips: number;
}

export interface TaskValidationRow {
  task: string;
  metric: string;
  result: number;
  status: "pass" | "fail";
  reference: string;
  evaluated: string;
}

export interface CorrelationPoint {
  uncertainty: number;
  error: number;
}

export interface ValidationResponse {
  job_id: string;
  compare_against: string;
  validated_at: string;
  metrics: ValidationMetric[];
  metric_trends: MetricTrendRow[];
  correlation: { r: number; points: CorrelationPoint[] };
  tasks: TaskValidationRow[];
}

/* ----------------------------------------------------------- New Job / Wizard */

export interface ModelOption {
  key: ModelType;
  name: string;
  description: string;
  avg_time: string;
  accuracy: MetricRating;
}

export interface NewJobEstimate {
  area_km2: number;
  estimated_time: string;
  estimated_storage_gb: number;
}

export interface NewJobPayload {
  project: string;
  job_name: string;
  satellite_source: string;
  model: ModelType;
  target_resolution_m: number;
  bands: string[];
  aoi_coordinates: number[][];
}

/* --------------------------------------------------------------------- Settings */

export interface DataSource {
  id: string;
  name: string;
  detail: string;
  status: "connected" | "disconnected";
  icon: string;
}

export interface SettingsResponse {
  default_model: ModelType;
  models: ModelOption[];
  target_resolution: string;
  bands: { rgb: boolean; nir: boolean; swir: boolean };
  auto_cloud_masking: boolean;
  uncertainty_map: boolean;
  gpu_allocation: number; // 1..8
  priority: "standard" | "high";
  estimated_cost_inr: number;
  data_sources: DataSource[];
}

/* --------------------------------------------------------------------- Shared */

export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
}
