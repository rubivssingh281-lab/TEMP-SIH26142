"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Calendar,
  Download,
  Info,
  ArrowUp,
  ArrowDown,
  Building2,
  Sprout,
  LineChart as LineChartIcon,
  Eye,
  CheckCircle2,
  Plus,
  Minus,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { downloadFile } from "@/lib/download";
import { toast, updateToast } from "@/components/ui/Toast";
import { Card, RatingChip } from "@/components/ui/Primitives";
import { Sparkline, MetricTrendChart, CorrelationScatter } from "@/components/ui/Charts";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import { cn } from "@/lib/utils";
import type { ValidationMetric } from "@/lib/types";

function ValidationInner() {
  const params = useSearchParams();
  const jobId = params.get("job") ?? "SR_v2_20240520_1030";
  const { data, error, loading } = useFetch(() => api.getValidation(jobId), [jobId]);
  const [exporting, setExporting] = useState(false);

  async function exportReport(id: string) {
    if (exporting) return;
    setExporting(true);
    const t = toast("Generating validation report…", "loading");
    try {
      await downloadFile(api.reports.validation(id), `validation-report-${id}.pdf`);
      updateToast(t, "Validation report downloaded (PDF)", "success");
    } catch (e) {
      updateToast(t, e instanceof Error ? e.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} /></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <div className="field-label">Report for Job ID</div>
            <div className="relative">
              <select className="select w-[240px]" defaultValue={data.job_id}><option>{data.job_id}</option></select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <div className="field-label">Compare Against</div>
            <div className="relative">
              <select className="select w-[260px]" defaultValue={data.compare_against}>
                <option>{data.compare_against}</option>
                <option>PlanetScope Reference (3 m)</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <div className="field-label">Date of Validation</div>
            <button className="input flex items-center gap-2 w-[240px]"><Calendar size={16} className="text-muted" /> {data.validated_at}</button>
          </div>
          <button
            onClick={() => exportReport(data.job_id)}
            disabled={exporting}
            className="ml-auto inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-primary text-primary text-[14px] font-medium hover:bg-primary-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} /> {exporting ? "Generating…" : "Export Report (PDF)"}
          </button>
        </div>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {data.metrics.map((m) => <MetricCard key={m.key} m={m} />)}
      </div>

      {/* Three panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-1.5 mb-3"><h3 className="text-[15px] font-semibold">Metric Trends Across Jobs</h3><span className="text-muted text-[13px]">(Last 10 Runs)</span><Info size={13} className="text-muted" /></div>
          <MetricTrendChart data={data.metric_trends} />
          <div className="text-center text-[12px] text-muted mt-1">Job Runs (Oldest → Newest)</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-1.5 mb-3"><h3 className="text-[15px] font-semibold">Spatial Accuracy Map</h3><span className="text-muted text-[13px]">(Per-Region PSNR)</span><Info size={13} className="text-muted" /></div>
          <div className="relative h-[300px] rounded-xl overflow-hidden bg-[#3a3a2c]">
            <SatelliteTile seed="ladakh-terrain-spatial" variant="sr" className="absolute inset-0 h-full w-full opacity-60" />
            <SpatialChoropleth />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              <MiniMapBtn><Plus size={15} /></MiniMapBtn>
              <MiniMapBtn><Minus size={15} /></MiniMapBtn>
              <MiniMapBtn><Layers size={15} /></MiniMapBtn>
            </div>
            <div className="absolute right-3 top-3 rounded-lg bg-white/95 shadow-sm px-2.5 py-2 text-[11px]">
              <div className="font-medium text-ink mb-1">PSNR (dB)</div>
              <Legend color="#1a9850" label="> 35" />
              <Legend color="#91cf60" label="30" />
              <Legend color="#fee08b" label="25" />
              <Legend color="#fc8d59" label="20" />
              <Legend color="#d73027" label="< 15" />
            </div>
            <span className="absolute left-3 bottom-3 rounded bg-black/55 px-2 py-1 text-[11px] text-white/90">5 km</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5"><h3 className="text-[15px] font-semibold">Uncertainty vs Accuracy Correlation</h3><Info size={13} className="text-muted" /></div>
          </div>
          <div className="text-right text-[13px] mb-1">Correlation (R) <span className="text-primary font-semibold">{data.correlation.r}</span></div>
          <CorrelationScatter points={data.correlation.points} />
        </Card>
      </div>

      {/* Task-based validation */}
      <Card className="p-5">
        <div className="flex items-center gap-1.5 mb-4"><h3 className="text-[16px] font-semibold">Task-Based Validation Results</h3><Info size={13} className="text-muted" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="pb-3 font-medium">Task</th>
                <th className="pb-3 font-medium">Metric</th>
                <th className="pb-3 font-medium">Result</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Reference Dataset</th>
                <th className="pb-3 font-medium">Date Evaluated</th>
                <th className="pb-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((t, i) => {
                const Icon = [Building2, Sprout, LineChartIcon][i % 3];
                return (
                  <tr key={t.task} className="border-b border-line last:border-0">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-lg bg-primary-50 grid place-items-center"><Icon size={16} className="text-primary" /></span>
                        <span className="font-medium text-ink">{t.task}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-ink-soft">{t.metric}</td>
                    <td className="py-3.5 font-semibold text-ink">{t.result.toFixed(2)}</td>
                    <td className="py-3.5"><span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 size={16} /> {t.status === "pass" ? "Pass" : "Fail"}</span></td>
                    <td className="py-3.5 text-ink-soft">{t.reference}</td>
                    <td className="py-3.5 text-ink-soft">{t.evaluated}</td>
                    <td className="py-3.5"><button className="h-8 w-8 grid place-items-center rounded-md border border-line hover:bg-canvas text-primary"><Eye size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ m }: { m: ValidationMetric }) {
  const up = m.delta_dir === "up";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1 text-[13px] text-muted">{m.label} <Info size={12} /></div>
      <div className="flex items-end justify-between mt-1">
        <div className="text-[26px] font-semibold text-ink leading-none">{m.value}<span className="text-[14px] text-muted ml-0.5">{m.unit}</span></div>
        <span className={cn("inline-flex items-center gap-0.5 text-[12.5px] font-medium", up ? "text-success" : "text-primary")}>
          {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {m.delta}
        </span>
      </div>
      <div className="my-2"><Sparkline data={m.trend} width={200} height={30} color="#0F8C7F" /></div>
      <RatingChip rating={m.rating} />
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-1.5 py-0.5"><span className="h-3 w-3 rounded-sm" style={{ background: color }} /><span className="text-ink-soft">{label}</span></div>;
}

function MiniMapBtn({ children }: { children: React.ReactNode }) {
  return <button className="h-7 w-7 grid place-items-center rounded-md bg-white/95 shadow-sm text-ink-soft hover:bg-white">{children}</button>;
}

function SpatialChoropleth() {
  // Deterministic hex-ish region grid tinted by "PSNR"
  const colors = ["#1a9850", "#91cf60", "#d9ef8b", "#fee08b", "#fc8d59", "#d73027"];
  const cells: { x: number; y: number; c: string }[] = [];
  let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 16; x++) {
      // organic mask
      const dx = x - 8, dy = y - 7;
      if (dx * dx / 60 + dy * dy / 48 > 1.05) continue;
      cells.push({ x: x * 6.25, y: y * 7.14, c: colors[Math.floor(rnd() * colors.length)] });
    }
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={6.6} height={7.5} fill={c.c} fillOpacity={0.78} stroke="#fff" strokeWidth={0.3} rx={1} />
      ))}
    </svg>
  );
}

export default function ValidationPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingState /></div>}>
      <ValidationInner />
    </Suspense>
  );
}
