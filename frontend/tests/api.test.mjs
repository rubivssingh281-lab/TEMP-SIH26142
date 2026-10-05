/**
 * Integration tests for the TerraSharp Atlas backend (Next.js API routes).
 *
 * Run against a live dev/prod server:
 *   npm run dev            # in one terminal (or npm run build && npm start)
 *   npm test               # in another
 *
 * Override the target with TEST_BASE_URL (e.g. a FastAPI backend on :8000).
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" } });
  assert.equal(res.ok, true, `${path} -> HTTP ${res.status}`);
  return res.json();
}

async function getPdf(path) {
  const res = await fetch(`${BASE}${path}`);
  assert.equal(res.ok, true, `${path} -> HTTP ${res.status}`);
  assert.equal(res.headers.get("content-type"), "application/pdf", `${path} content-type`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

before(async () => {
  try {
    await fetch(`${BASE}/api/dashboard`);
  } catch {
    throw new Error(`No server reachable at ${BASE}. Start it with "npm run dev" first.`);
  }
});

// ---------------------------------------------------------------- JSON API

test("GET /api/dashboard returns stats + recent job", async () => {
  const d = await getJson("/api/dashboard");
  assert.ok(d.stats.total_projects >= 0);
  assert.ok(d.recent_job.job_id);
  assert.ok(Array.isArray(d.recent_jobs));
  assert.ok(d.system_status.gpu_cluster.trend.length > 0);
});

test("GET /api/queue returns jobs + cluster, honours status filter", async () => {
  const all = await getJson("/api/queue");
  assert.ok(Array.isArray(all.jobs));
  assert.ok(all.cluster.nodes.length > 0);
  const completed = await getJson("/api/queue?status=completed");
  assert.ok(completed.jobs.every((j) => j.status === "completed"));
});

test("GET /api/projects supports search + category", async () => {
  const all = await getJson("/api/projects");
  assert.ok(all.projects.length > 0);
  const active = await getJson("/api/projects?category=Active");
  assert.ok(active.projects.every((p) => p.status === "active"));
  const search = await getJson("/api/projects?q=ladakh");
  assert.ok(search.projects.length >= 1);
});

test("GET /api/comparison/:id returns metrics + crops", async () => {
  const c = await getJson("/api/comparison/SR_TEST");
  assert.equal(c.job_id, "SR_TEST");
  assert.ok(c.metrics.length >= 4);
  assert.ok(c.crops.length >= 1);
  assert.ok(c.pixel.bands.length >= 1);
});

test("GET /api/validation/:id returns metrics + tasks + correlation", async () => {
  const v = await getJson("/api/validation/SR_TEST");
  assert.equal(v.job_id, "SR_TEST");
  assert.ok(v.metrics.length >= 1);
  assert.ok(v.tasks.length >= 1);
  assert.ok(typeof v.correlation.r === "number");
});

test("GET + PUT /api/settings round-trips", async () => {
  const s = await getJson("/api/settings");
  assert.ok(s.default_model);
  const res = await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority: "high" }),
  });
  assert.equal(res.ok, true);
  const saved = await res.json();
  assert.equal(saved.priority, "high");
});

test("POST /api/jobs/estimate scales with area", async () => {
  const res = await fetch(`${BASE}/api/jobs/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ area_km2: 20 }),
  });
  const e = await res.json();
  assert.equal(e.area_km2, 20);
  assert.match(e.estimated_time, /\dh \d\dm/);
  assert.ok(e.estimated_storage_gb > 0);
});

test("POST /api/jobs returns a queued job id", async () => {
  const res = await fetch(`${BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_name: "SR_test", project: "Ladakh" }),
  });
  const j = await res.json();
  assert.match(j.job_id, /^SR_v2_/);
  assert.equal(j.status, "queued");
});

// ------------------------------------------------------------- PDF reports

function assertValidPdf(buf, minSize = 800) {
  assert.equal(buf.subarray(0, 5).toString("latin1"), "%PDF-", "PDF magic bytes");
  assert.ok(buf.length > minSize, `PDF suspiciously small (${buf.length} bytes)`);
  assert.ok(buf.subarray(-16).toString("latin1").trimEnd().endsWith("%%EOF"), "PDF trailer");
}

test("GET /api/reports/validation/:id returns a valid PDF", async () => {
  assertValidPdf(await getPdf("/api/reports/validation/SR_v2_TEST"));
});

test("GET /api/reports/comparison/:id returns a valid PDF", async () => {
  assertValidPdf(await getPdf("/api/reports/comparison/SR_v2_TEST"));
});

test("GET /api/reports/job/:id returns a valid PDF", async () => {
  assertValidPdf(await getPdf("/api/reports/job/SR_v2_20240521_0900"));
});

test("GET /api/reports/invoice/:id returns a valid PDF", async () => {
  assertValidPdf(await getPdf("/api/reports/invoice/INV-2024-00045?amount=124560"));
});
