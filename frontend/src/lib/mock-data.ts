/**
 * Seed data for the built-in mock API routes. Shapes match src/lib/types.ts and
 * ../FASTAPI_CONTRACT.md exactly, so swapping in the FastAPI backend is a no-op
 * for the frontend. Image fields are *seed strings* — the UI renders satellite
 * textures / heatmaps procedurally from them (see components/map/*).
 */
import type {
  ClusterLoad,
  ComparisonResponse,
  CurrentUser,
  DashboardResponse,
  JobDetail,
  ModelOption,
  Project,
  QueueStats,
  SettingsResponse,
  ValidationResponse,
} from "./types";

const spark = (base: number, n = 16, amp = 8): { t: string; v: number }[] =>
  Array.from({ length: n }, (_, i) => ({
    t: String(i),
    v: Math.round(base + Math.sin(i / 1.7) * amp + (i % 3) * (amp / 3)),
  }));

export const CURRENT_USER: CurrentUser = {
  name: "Arjun Pratap",
  role: "NTRO Analyst",
  initials: "AP",
};

export const MODEL_OPTIONS: ModelOption[] = [
  { key: "gan", name: "GAN", description: "Generative Adversarial Networks for sharp detail reconstruction", avg_time: "~ 18 min", accuracy: "excellent" },
  { key: "diffusion", name: "Diffusion", description: "Diffusion models for high fidelity and texture generation", avg_time: "~ 24 min", accuracy: "excellent" },
  { key: "transformer", name: "Transformer", description: "Vision Transformers for global context understanding", avg_time: "~ 22 min", accuracy: "good" },
  { key: "cnn", name: "CNN", description: "Convolutional Neural Networks for fast super-resolution", avg_time: "~ 12 min", accuracy: "fair" },
];

export const DASHBOARD: DashboardResponse = {
  last_updated: "10:42 AM IST",
  stats: {
    total_projects: 12,
    active_projects: 3,
    total_jobs: 48,
    completed_jobs: 28,
    processing_jobs: 6,
    completed_this_month: 28,
    storage_used_tb: 2.41,
    storage_total_tb: 10,
  },
  system_status: {
    gpu_cluster: { health: "healthy", utilization_pct: 24, trend: spark(40, 16, 14) },
    storage: { used_pct: 24, trend: spark(38, 16, 10) },
    api_services: { status: "operational" },
    data_ingestion: { status: "active" },
  },
  recent_job: {
    job_id: "SR_v2_20240520_1030",
    status: "completed",
    area_km2: 12.6,
    location: "34.2345° N, 77.5612° E",
    acquisition_date: "18 May 2024",
    model: "भू DRISTI v2.1",
    resolution_gain: "4x (10m → 2.5m)",
    lr_image: "ladakh-urban",
    sr_image: "ladakh-urban",
    uncertainty_image: "ladakh-urban",
    lr_resolution: "10 m / pixel",
    sr_resolution: "2.5 m / pixel",
  },
  recent_jobs: [
    { job_id: "SR_v2_20240520_1030", project: "Ladakh Border Infra", status: "completed", date: "20 May 2024", resolution_gain: "4x" },
    { job_id: "SR_v2_20240520_0915", project: "Ladakh Border Infra", status: "completed", date: "20 May 2024", resolution_gain: "4x" },
    { job_id: "SR_v2_20240519_1545", project: "Arunachal Outposts", status: "processing", date: "19 May 2024", resolution_gain: "4x" },
    { job_id: "SR_v2_20240519_1420", project: "Siachen Glacier Study", status: "queued", date: "19 May 2024", resolution_gain: "4x" },
    { job_id: "SR_v2_20240518_1130", project: "Western Border Roads", status: "failed", date: "18 May 2024", resolution_gain: "4x" },
  ],
};

export const QUEUE_STATS: QueueStats = {
  queued: 8,
  processing: 6,
  avg_progress_pct: 68,
  completed_today: 28,
  failed: 2,
};

export const CLUSTER: ClusterLoad = {
  health: "healthy",
  overall_utilization_pct: 68,
  trend: spark(55, 24, 18),
  nodes: [
    { name: "GPU-Node-01", utilization_pct: 75 },
    { name: "GPU-Node-02", utilization_pct: 82 },
    { name: "GPU-Node-03", utilization_pct: 65 },
    { name: "GPU-Node-04", utilization_pct: 48 },
  ],
};

export const QUEUE_JOBS: JobDetail[] = [
  {
    job_id: "SR_v2_20240521_0900", project: "Ladakh Border Infra", status: "processing", date: "21 May 2024",
    resolution_gain: "4x", progress: 64, compute_node: "GPU-Node-03", gpu: "A100 40GB",
    started: "21 May 2024 09:00 AM", eta: "21 May 2024 11:15 AM", lr_thumb: "ladakh-01", sr_thumb: "ladakh-01",
    tiles_processed: 1248, tiles_total: 1952, throughput_mbps: 312,
    stages: [
      { name: "Pre-processing", state: "completed", detail: "Completed · 09:00 AM" },
      { name: "Model Inference", state: "in_progress", detail: "In Progress", progress: 64 },
      { name: "Post-processing", state: "pending", detail: "Pending" },
      { name: "Validation", state: "pending", detail: "Pending" },
    ],
  },
  {
    job_id: "SR_v2_20240521_0845", project: "Ladakh Border Infra", status: "processing", date: "21 May 2024",
    resolution_gain: "4x", progress: 32, compute_node: "GPU-Node-02", gpu: "A100 40GB",
    started: "21 May 2024 08:45 AM", eta: "21 May 2024 11:30 AM", lr_thumb: "ladakh-02", sr_thumb: "ladakh-02",
    tiles_processed: 620, tiles_total: 1940, throughput_mbps: 288, stages: [],
  },
  {
    job_id: "SR_v2_20240521_0745", project: "Arunachal Outposts", status: "completed", date: "21 May 2024",
    resolution_gain: "4x", progress: 100, compute_node: "GPU-Node-01", gpu: "A100 40GB",
    started: "21 May 2024 07:45 AM", eta: "21 May 2024 09:20 AM", lr_thumb: "arunachal-01", sr_thumb: "arunachal-01",
    tiles_processed: 1880, tiles_total: 1880, throughput_mbps: 340, stages: [],
  },
  {
    job_id: "SR_v2_20240521_0710", project: "Siachen Glacier Study", status: "queued", date: "21 May 2024",
    resolution_gain: "4x", progress: 0, compute_node: "GPU-Node-04", gpu: "A100 40GB",
    started: "—", eta: "21 May 2024 01:10 PM", lr_thumb: "siachen-01", sr_thumb: "siachen-01",
    tiles_processed: 0, tiles_total: 1600, throughput_mbps: 0, stages: [],
  },
  {
    job_id: "SR_v2_20240521_0605", project: "Western Border Roads", status: "failed", date: "21 May 2024",
    resolution_gain: "4x", progress: 0, compute_node: "GPU-Node-02", gpu: "A100 40GB",
    started: "21 May 2024 06:05 AM", eta: "—", lr_thumb: "western-01", sr_thumb: "western-01",
    tiles_processed: 0, tiles_total: 1720, throughput_mbps: 0, stages: [],
  },
  {
    job_id: "SR_v2_20240520_2330", project: "Ladakh Border Infra", status: "completed", date: "20 May 2024",
    resolution_gain: "4x", progress: 100, compute_node: "GPU-Node-03", gpu: "A100 40GB",
    started: "20 May 2024 11:30 PM", eta: "21 May 2024 01:05 AM", lr_thumb: "ladakh-03", sr_thumb: "ladakh-03",
    tiles_processed: 1952, tiles_total: 1952, throughput_mbps: 305, stages: [],
  },
];

export const PROJECTS: Project[] = [
  {
    id: "ladakh-border-infrastructure", name: "Ladakh Border Infrastructure", status: "active",
    category: "Border Infrastructure",
    description: "High-resolution mapping and infrastructure monitoring along the Ladakh border region.",
    jobs: 48, last_updated: "21 May 2024", total_area_km2: 1248.6, complete_pct: 78, cover_image: "ladakh-mtn",
    recent_runs: [
      { date: "17 May", status: "completed" }, { date: "18 May", status: "completed" },
      { date: "19 May", status: "failed" }, { date: "20 May", status: "completed" },
      { date: "21 May", status: "queued" },
    ],
    team: [
      { initials: "AP", name: "Arjun Pratap", color: "#D6532B" },
      { initials: "RK", name: "Ravi Kumar", color: "#0F8C7F" },
      { initials: "SS", name: "Sneha Singh", color: "#8A857B" },
    ],
  },
  {
    id: "arunachal-outposts", name: "Arunachal Outposts", status: "active", category: "Border Infrastructure",
    description: "Monitoring of forward outposts and access routes across Arunachal Pradesh.",
    jobs: 32, last_updated: "20 May 2024", total_area_km2: 872.3, complete_pct: 65, cover_image: "arunachal-mtn",
    recent_runs: [], team: [],
  },
  {
    id: "siachen-glacier-study", name: "Siachen Glacier Study", status: "active", category: "Disaster Response",
    description: "Glacier movement and terrain change study over the Siachen region.",
    jobs: 27, last_updated: "18 May 2024", total_area_km2: 654.1, complete_pct: 52, cover_image: "siachen-snow",
    recent_runs: [], team: [],
  },
  {
    id: "punjab-crop-monitoring", name: "Punjab Crop Monitoring", status: "active", category: "Agriculture",
    description: "Seasonal crop boundary and health monitoring across Punjab farmland.",
    jobs: 41, last_updated: "17 May 2024", total_area_km2: 1533.7, complete_pct: 84, cover_image: "punjab-fields",
    recent_runs: [], team: [],
  },
  {
    id: "mumbai-urban-expansion", name: "Mumbai Urban Expansion", status: "archived", category: "Urban Planning",
    description: "Urban growth and land-use change tracking for the Mumbai metropolitan area.",
    jobs: 36, last_updated: "10 Apr 2024", total_area_km2: 345.2, complete_pct: 100, cover_image: "mumbai-urban",
    recent_runs: [], team: [],
  },
  {
    id: "kerala-flood-assessment", name: "Kerala Flood Assessment", status: "archived", category: "Disaster Response",
    description: "Post-monsoon flood extent and damage assessment across Kerala.",
    jobs: 22, last_updated: "05 Apr 2024", total_area_km2: 982.4, complete_pct: 100, cover_image: "kerala-flood",
    recent_runs: [], team: [],
  },
];

export const PROJECT_CATEGORIES = [
  "All", "Active", "Archived", "Border Infrastructure", "Agriculture", "Urban Planning", "Disaster Response",
];

export function buildComparison(jobId: string): ComparisonResponse {
  return {
    job_id: jobId,
    lr_image: "ladakh-urban",
    sr_image: "ladakh-urban",
    lr_resolution: "10 m / pixel",
    sr_resolution: "2.5 m / pixel",
    coordinate: "34.2345° N, 77.5612° E",
    crops: [
      { id: "a01", label: "Building Cluster", sub: "Area 01", image: "crop-buildings" },
      { id: "a02", label: "Road Network", sub: "Area 02", image: "crop-roads" },
      { id: "a03", label: "Field Boundary", sub: "Area 03", image: "crop-fields" },
      { id: "a04", label: "Water Edge", sub: "Area 04", image: "crop-water" },
      { id: "a05", label: "Mountain Ridge", sub: "Area 05", image: "crop-ridge" },
    ],
    pixel: {
      coordinate: "34.2345° N, 77.5612° E",
      valid: true,
      bands: [
        { band: "B2 (Blue)", reflectance: 0.124 },
        { band: "B3 (Green)", reflectance: 0.186 },
        { band: "B4 (Red)", reflectance: 0.203 },
        { band: "B8 (NIR)", reflectance: 0.362 },
        { band: "B11 (SWIR 1)", reflectance: 0.274 },
        { band: "B12 (SWIR 2)", reflectance: 0.198 },
      ],
    },
    metrics: [
      { key: "psnr", label: "PSNR", value: "34.58 dB", threshold: "> 30 dB", pass: true },
      { key: "ssim", label: "SSIM", value: "0.912", threshold: "> 0.85", pass: true },
      { key: "sam", label: "SAM", value: "3.21°", threshold: "< 5°", pass: true },
      { key: "ergas", label: "ERGAS", value: "2.48", threshold: "< 3.0", pass: true },
    ],
  };
}

const corrPoints = Array.from({ length: 70 }, (_, i) => {
  const u = i / 70 + Math.random() * 0.05;
  const err = Math.pow(10, 0.4 - u * 2.4 + (Math.random() - 0.5) * 0.7);
  return { uncertainty: Math.min(1, u), error: Math.max(0.01, err) };
});

export function buildValidation(jobId: string): ValidationResponse {
  return {
    job_id: jobId,
    compare_against: "WorldView-3 Reference (0.3 m)",
    validated_at: "21 May 2024 11:30 AM IST",
    metrics: [
      { key: "psnr", label: "PSNR", value: "31.2", unit: "dB", delta: "2.1 dB", delta_dir: "up", rating: "excellent", trend: spark(31, 14, 2) },
      { key: "ssim", label: "SSIM", value: "0.89", unit: "", delta: "0.04", delta_dir: "up", rating: "excellent", trend: spark(28, 14, 2) },
      { key: "sam", label: "SAM", value: "2.4", unit: "°", delta: "0.3°", delta_dir: "down", rating: "good", trend: spark(24, 14, 2) },
      { key: "ergas", label: "ERGAS", value: "3.1", unit: "", delta: "0.6", delta_dir: "down", rating: "good", trend: spark(20, 14, 2) },
      { key: "lpips", label: "LPIPS", value: "0.11", unit: "", delta: "0.03", delta_dir: "down", rating: "excellent", trend: spark(14, 14, 2) },
    ],
    metric_trends: Array.from({ length: 10 }, (_, i) => ({
      run: `SR_v2_05${11 + i}`,
      psnr: 30 + Math.sin(i / 2) * 2 + i * 0.2,
      ssim: 27 + Math.sin(i / 3) * 1.2,
      sam: 18 + Math.sin(i / 2.5) * 1.5 + i * 0.1,
      ergas: 10 + Math.cos(i / 2) * 1,
      lpips: 5 + Math.sin(i / 3) * 0.6,
    })),
    correlation: { r: -0.72, points: corrPoints },
    tasks: [
      { task: "Building Detection Accuracy", metric: "mAP@0.5", result: 0.86, status: "pass", reference: "OpenBuildings v3", evaluated: "21 May 2024" },
      { task: "Crop Boundary IoU", metric: "Mean IoU", result: 0.78, status: "pass", reference: "ESA WorldCrops 10m", evaluated: "21 May 2024" },
      { task: "Change Detection F1-Score", metric: "F1-Score", result: 0.81, status: "pass", reference: "ESA CCI Change Maps", evaluated: "21 May 2024" },
    ],
  };
}

export const SETTINGS: SettingsResponse = {
  default_model: "gan",
  models: MODEL_OPTIONS,
  target_resolution: "2.5 m / pixel",
  bands: { rgb: true, nir: true, swir: false },
  auto_cloud_masking: true,
  uncertainty_map: true,
  gpu_allocation: 2,
  priority: "standard",
  estimated_cost_inr: 320,
  data_sources: [
    { id: "copernicus", name: "Copernicus Data Space Ecosystem", detail: "Sentinel-1, Sentinel-2, Sentinel-3", status: "connected", icon: "copernicus" },
    { id: "sentinel-hub", name: "Sentinel Hub API", detail: "High-res imagery & processing", status: "connected", icon: "sentinel" },
  ],
};

export const SATELLITE_SOURCES = [
  { value: "sentinel-2", label: "Sentinel-2", detail: "Sentinel-2 MSI · 10m, 20m, 60m Native Resolution" },
  { value: "sentinel-1", label: "Sentinel-1", detail: "Sentinel-1 SAR · 5m x 20m" },
  { value: "landsat-9", label: "Landsat 9", detail: "OLI-2 / TIRS-2 · 15m, 30m, 100m" },
];
