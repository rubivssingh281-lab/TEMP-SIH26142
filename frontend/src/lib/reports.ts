/**
 * Report layouts built on top of the dependency-free PdfDoc writer.
 * Each function turns a typed response into downloadable PDF bytes.
 */
import { PdfDoc } from "./pdf";
import { seededRandom } from "./utils";
import type { ComparisonResponse, JobDetail, ValidationResponse } from "./types";

type RGB = [number, number, number];

const RUST: RGB = [0.84, 0.325, 0.169];
const TEAL: RGB = [0.059, 0.549, 0.498];
const INK: RGB = [0.13, 0.12, 0.1];
const MUTED: RGB = [0.54, 0.52, 0.48];
const LINE: RGB = [0.86, 0.85, 0.82];
const OK: RGB = [0.082, 0.502, 0.239];

const M = 48; // page margin

const BIOME_CELLS: Record<string, RGB[]> = {
  urban: [[0.55, 0.52, 0.46], [0.48, 0.45, 0.39], [0.72, 0.69, 0.62], [0.42, 0.39, 0.34]],
  terrain: [[0.47, 0.47, 0.32], [0.37, 0.38, 0.25], [0.65, 0.65, 0.45], [0.3, 0.32, 0.2]],
  snow: [[0.86, 0.88, 0.9], [0.72, 0.75, 0.79], [0.95, 0.96, 0.97], [0.6, 0.63, 0.68]],
  fields: [[0.54, 0.58, 0.31], [0.46, 0.53, 0.24], [0.76, 0.75, 0.44], [0.37, 0.45, 0.2]],
  water: [[0.27, 0.43, 0.44], [0.18, 0.3, 0.3], [0.5, 0.69, 0.7], [0.14, 0.25, 0.24]],
};

function biomeFor(seed: string): keyof typeof BIOME_CELLS {
  const s = seed.toLowerCase();
  if (/urban|building|mumbai|road/.test(s)) return "urban";
  if (/snow|siachen|glacier/.test(s)) return "snow";
  if (/field|punjab|crop/.test(s)) return "fields";
  if (/water|flood|kerala/.test(s)) return "water";
  return "terrain";
}

/** Draw a small procedural "satellite" thumbnail inside the PDF. */
function mapThumb(doc: PdfDoc, x: number, y: number, w: number, h: number, seed: string, coarse: boolean) {
  const rand = seededRandom(seed + (coarse ? "lr" : "sr"));
  const pal = BIOME_CELLS[biomeFor(seed)];
  const g = coarse ? 8 : 20;
  const cw = w / g, ch = h / g;
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      doc.rect(x + i * cw, y + j * ch, cw + 0.4, ch + 0.4, pal[Math.floor(rand() * pal.length)]);
    }
  }
  // a road / river streak to read as a map
  const steps = 8;
  let px = x, py = y + h * (0.3 + rand() * 0.4);
  for (let s = 1; s <= steps; s++) {
    const nx = x + (w * s) / steps;
    const ny = y + h * (0.3 + Math.sin(s + rand()) * 0.18 + rand() * 0.2);
    doc.line(px, py, nx, ny, biomeFor(seed) === "urban" ? [0.82, 0.79, 0.72] : [0.43, 0.64, 0.65], coarse ? 2 : 1.2);
    px = nx; py = ny;
  }
  doc.line(x, y, x + w, y, LINE, 0.5).line(x, y + h, x + w, y + h, LINE, 0.5);
  doc.line(x, y, x, y + h, LINE, 0.5).line(x + w, y, x + w, y + h, LINE, 0.5);
}

function header(doc: PdfDoc, title: string, subtitle: string) {
  doc.rect(0, 0, doc.w, 8, RUST);
  doc.rect(M, 40, 22, 22, RUST);
  doc.text(M + 4, 45, "BD", { size: 12, bold: true, color: [1, 1, 1] });
  doc.text(M + 32, 40, "Bhu DRISTI", { size: 15, bold: true });
  doc.text(M + 32, 58, "AI Super-Resolution Platform", { size: 8.5, color: MUTED });
  doc.text(doc.w - M - 150, 44, "NTRO — Internal Use Only", { size: 8.5, bold: true, color: RUST });
  doc.line(M, 78, doc.w - M, 78, LINE, 1);
  doc.text(M, 96, title, { size: 20, bold: true });
  doc.text(M, 122, subtitle, { size: 10, color: MUTED });
}

function footer(doc: PdfDoc, page: number) {
  doc.line(M, doc.h - 44, doc.w - M, doc.h - 44, LINE, 0.7);
  doc.text(M, doc.h - 36, `Generated ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`, { size: 8, color: MUTED });
  doc.text(doc.w - M - 60, doc.h - 36, `Page ${page}`, { size: 8, color: MUTED });
  doc.text(doc.w - M - 200, doc.h - 22, "Synthetic demonstration data — no classified imagery.", { size: 7.5, color: MUTED });
}

function sectionTitle(doc: PdfDoc, y: number, label: string) {
  doc.rect(M, y - 2, 3, 14, RUST);
  doc.text(M + 10, y, label, { size: 13, bold: true });
}

// ------------------------------------------------------------- Validation

export function validationReportPdf(d: ValidationResponse): Uint8Array {
  const doc = new PdfDoc();
  header(doc, "Validation Report", `Job ${d.job_id}`);

  let y = 150;
  doc.text(M, y, "Compared against:", { size: 10, color: MUTED });
  doc.text(M + 110, y, d.compare_against, { size: 10, bold: true });
  doc.text(doc.w - M - 220, y, "Validated:", { size: 10, color: MUTED });
  doc.text(doc.w - M - 160, y, d.validated_at, { size: 10, bold: true });

  y += 34;
  sectionTitle(doc, y, "Quality Metrics");
  y += 24;
  const colW = (doc.w - 2 * M) / d.metrics.length;
  d.metrics.forEach((m, i) => {
    const x = M + i * colW;
    doc.rect(x, y, colW - 8, 66, [0.97, 0.96, 0.94]);
    doc.text(x + 10, y + 10, m.label, { size: 9, color: MUTED });
    doc.text(x + 10, y + 26, `${m.value}${m.unit}`, { size: 17, bold: true });
    doc.text(x + 10, y + 50, `${m.delta_dir === "up" ? "+" : "-"}${m.delta}  ${m.rating}`, { size: 8, color: m.delta_dir === "up" ? OK : RUST });
  });

  y += 96;
  sectionTitle(doc, y, "Spatial Accuracy Map (Per-Region PSNR)");
  y += 22;
  mapThumb(doc, M, y, 220, 150, `${d.job_id}-spatial`, false);
  // legend
  const legend: [string, RGB][] = [
    ["> 35 dB", [0.1, 0.6, 0.31]], ["30", [0.57, 0.81, 0.38]], ["25", [1, 0.88, 0.55]],
    ["20", [0.99, 0.55, 0.35]], ["< 15", [0.84, 0.19, 0.15]],
  ];
  legend.forEach(([lab, c], i) => {
    const ly = y + 6 + i * 20;
    doc.rect(M + 240, ly, 12, 12, c);
    doc.text(M + 258, ly + 1, lab, { size: 9, color: INK });
  });
  doc.text(M + 340, y + 6, `Uncertainty vs Accuracy Correlation (R):`, { size: 9, color: MUTED });
  doc.text(M + 340, y + 22, String(d.correlation.r), { size: 20, bold: true, color: TEAL });

  y += 172;
  sectionTitle(doc, y, "Task-Based Validation Results");
  y += 22;
  const cols = ["Task", "Metric", "Result", "Status", "Reference"];
  const cx = [M, M + 170, M + 250, M + 310, M + 370];
  doc.rect(M, y - 4, doc.w - 2 * M, 20, [0.95, 0.94, 0.92]);
  cols.forEach((c, i) => doc.text(cx[i], y, c, { size: 9, bold: true, color: MUTED }));
  y += 22;
  d.tasks.forEach((t) => {
    doc.text(cx[0], y, t.task, { size: 9.5, color: INK });
    doc.text(cx[1], y, t.metric, { size: 9.5, color: MUTED });
    doc.text(cx[2], y, t.result.toFixed(2), { size: 9.5, bold: true });
    doc.text(cx[3], y, t.status === "pass" ? "Pass" : "Fail", { size: 9.5, bold: true, color: t.status === "pass" ? OK : RUST });
    doc.text(cx[4], y, t.reference, { size: 9.5, color: MUTED });
    doc.line(M, y + 14, doc.w - M, y + 14, LINE, 0.5);
    y += 24;
  });

  footer(doc, 1);
  return doc.build();
}

// ------------------------------------------------------------- Comparison

export function comparisonSnapshotPdf(d: ComparisonResponse): Uint8Array {
  const doc = new PdfDoc();
  header(doc, "Comparison Snapshot", `Job ${d.job_id}  ·  ${d.coordinate}`);

  let y = 150;
  const halfW = (doc.w - 2 * M - 20) / 2;
  doc.text(M, y, "Low Resolution (Sentinel-2)", { size: 10, bold: true });
  doc.text(M + halfW + 20, y, "Super-Resolved (Bhu DRISTI)", { size: 10, bold: true });
  y += 8;
  mapThumb(doc, M, y, halfW, 200, d.lr_image, true);
  mapThumb(doc, M + halfW + 20, y, halfW, 200, d.sr_image, false);
  doc.text(M + 6, y + 184, d.lr_resolution, { size: 9, bold: true, color: [1, 1, 1] });
  doc.text(M + halfW + 26, y + 184, d.sr_resolution, { size: 9, bold: true, color: [1, 1, 1] });

  y += 226;
  sectionTitle(doc, y, "Quality Metrics (vs. Reference)");
  y += 24;
  const colW = (doc.w - 2 * M) / d.metrics.length;
  d.metrics.forEach((m, i) => {
    const x = M + i * colW;
    doc.rect(x, y, 3, 60, TEAL);
    doc.rect(x + 3, y, colW - 12, 60, [0.97, 0.96, 0.94]);
    doc.text(x + 12, y + 10, m.label, { size: 9, color: MUTED });
    doc.text(x + 12, y + 26, m.value, { size: 16, bold: true });
    doc.text(x + 12, y + 46, `Threshold ${m.threshold}  ${m.pass ? "PASS" : "FAIL"}`, { size: 7.5, color: m.pass ? OK : RUST });
  });

  y += 90;
  sectionTitle(doc, y, "Pixel Inspector");
  y += 22;
  doc.text(M, y, `Coordinate: ${d.pixel.coordinate}`, { size: 9.5, color: INK });
  y += 20;
  d.pixel.bands.forEach((b) => {
    doc.text(M, y, b.band, { size: 9.5, color: MUTED });
    doc.text(M + 160, y, b.reflectance.toFixed(3), { size: 9.5, bold: true });
    y += 16;
  });

  footer(doc, 1);
  return doc.build();
}

// ------------------------------------------------------------- Job manifest

export function jobManifestPdf(j: JobDetail): Uint8Array {
  const doc = new PdfDoc();
  header(doc, "Job Manifest", `${j.job_id}  ·  ${j.project}`);
  let y = 150;
  mapThumb(doc, M, y, 200, 130, j.sr_thumb ?? j.job_id, false);
  const rows: [string, string][] = [
    ["Status", j.status], ["Resolution gain", j.resolution_gain], ["Compute node", `${j.compute_node ?? "—"} (${j.gpu ?? "—"})`],
    ["Started", j.started ?? "—"], ["Est. completion", j.eta ?? "—"],
    ["Tiles processed", `${j.tiles_processed.toLocaleString()} / ${j.tiles_total.toLocaleString()}`],
    ["Throughput", `${j.throughput_mbps} MB/s`],
  ];
  let ry = y;
  rows.forEach(([k, v]) => {
    doc.text(M + 220, ry, k, { size: 9.5, color: MUTED });
    doc.text(M + 350, ry, v, { size: 9.5, bold: true });
    ry += 20;
  });
  footer(doc, 1);
  return doc.build();
}

// ------------------------------------------------------------- Invoice

export function invoicePdf(id: string, amountInr: number, dateStr: string): Uint8Array {
  const doc = new PdfDoc();
  header(doc, "Invoice", `${id}  ·  ${dateStr}`);
  let y = 160;
  const lines: [string, number][] = [
    ["Super-Resolution compute (GPU-hours)", Math.round(amountInr * 0.62)],
    ["Storage & data egress", Math.round(amountInr * 0.23)],
    ["Platform subscription", Math.round(amountInr * 0.15)],
  ];
  doc.rect(M, y - 4, doc.w - 2 * M, 20, [0.95, 0.94, 0.92]);
  doc.text(M + 8, y, "Description", { size: 9, bold: true, color: MUTED });
  doc.text(doc.w - M - 90, y, "Amount (INR)", { size: 9, bold: true, color: MUTED });
  y += 26;
  lines.forEach(([k, v]) => {
    doc.text(M + 8, y, k, { size: 10, color: INK });
    doc.text(doc.w - M - 90, y, `Rs ${v.toLocaleString("en-IN")}`, { size: 10, bold: true });
    doc.line(M, y + 14, doc.w - M, y + 14, LINE, 0.5);
    y += 24;
  });
  y += 10;
  doc.text(doc.w - M - 200, y, "Total", { size: 12, bold: true });
  doc.text(doc.w - M - 90, y, `Rs ${Math.round(amountInr).toLocaleString("en-IN")}`, { size: 12, bold: true, color: RUST });
  footer(doc, 1);
  return doc.build();
}
