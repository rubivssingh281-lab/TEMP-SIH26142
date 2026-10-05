/**
 * Typed API client — the single integration seam.
 *
 * Every screen calls these functions; none call `fetch` directly. The base URL
 * is resolved once:
 *
 *   • NEXT_PUBLIC_API_BASE_URL set  → requests go to your FastAPI backend
 *   • unset                         → requests go to the built-in Next.js mock
 *                                     routes under /api/* (same shapes)
 *
 * So "integrating with FastAPI" is purely a matter of setting one env var and
 * making the backend return the shapes in src/lib/types.ts (see FASTAPI_CONTRACT.md).
 */
import type {
  ComparisonResponse,
  DashboardResponse,
  NewJobEstimate,
  NewJobPayload,
  ProjectsResponse,
  QueueResponse,
  SettingsResponse,
  ValidationResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

/** Build a URL: absolute FastAPI path when BASE is set, else local /api route. */
function url(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}/api${p}` : `/api${p}`;
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return (await res.json()) as T;
}

export const api = {
  isRemote: Boolean(BASE),
  baseUrl: BASE || "(built-in mock routes)",

  getDashboard: () => get<DashboardResponse>("/dashboard"),

  getQueue: (params?: { page?: number; status?: string; project?: string; q?: string }) => {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.status && params.status !== "all") s.set("status", params.status);
    if (params?.project && params.project !== "all") s.set("project", params.project);
    if (params?.q) s.set("q", params.q);
    const qs = s.toString();
    return get<QueueResponse>(`/queue${qs ? `?${qs}` : ""}`);
  },

  getProjects: (params?: { category?: string; q?: string; sort?: string }) => {
    const s = new URLSearchParams();
    if (params?.category && params.category !== "All") s.set("category", params.category);
    if (params?.q) s.set("q", params.q);
    if (params?.sort) s.set("sort", params.sort);
    const qs = s.toString();
    return get<ProjectsResponse>(`/projects${qs ? `?${qs}` : ""}`);
  },

  getComparison: (jobId: string) => get<ComparisonResponse>(`/comparison/${encodeURIComponent(jobId)}`),

  getValidation: (jobId: string) => get<ValidationResponse>(`/validation/${encodeURIComponent(jobId)}`),

  getSettings: () => get<SettingsResponse>("/settings"),

  saveSettings: (body: Partial<SettingsResponse>) =>
    get<SettingsResponse>("/settings", { method: "PUT", body: JSON.stringify(body) }),

  estimateJob: (body: Partial<NewJobPayload> & { area_km2?: number }) =>
    get<NewJobEstimate>("/jobs/estimate", { method: "POST", body: JSON.stringify(body) }),

  submitJob: (body: NewJobPayload) =>
    get<{ job_id: string; status: string }>("/jobs", { method: "POST", body: JSON.stringify(body) }),

  /** Downloadable report/document URLs (served as application/pdf). */
  reports: {
    validation: (jobId: string) => url(`/reports/validation/${encodeURIComponent(jobId)}`),
    comparison: (jobId: string) => url(`/reports/comparison/${encodeURIComponent(jobId)}`),
    job: (jobId: string) => url(`/reports/job/${encodeURIComponent(jobId)}`),
    invoice: (id: string, amount?: number, date?: string) => {
      const s = new URLSearchParams();
      if (amount != null) s.set("amount", String(amount));
      if (date) s.set("date", date);
      const qs = s.toString();
      return url(`/reports/invoice/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`);
    },
  },
};
