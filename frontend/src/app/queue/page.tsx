"use client";

import { useState } from "react";
import {
  Clock,
  Boxes,
  CheckCircle2,
  AlertOctagon,
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  ArrowRight,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { downloadFile } from "@/lib/download";
import { toast, updateToast } from "@/components/ui/Toast";
import { Card, StatusBadge, Button, ProgressBar, Donut, Pill } from "@/components/ui/Primitives";
import { UtilizationChart } from "@/components/ui/Charts";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import type { JobDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function QueuePage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const { data, error, loading, refetch } = useFetch(() => api.getQueue({ status, q }), [status, q]);

  if (loading && !data) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} /></div>;
  if (!data) return null;

  const { stats, jobs, cluster } = data;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QueueStat title="Queued" value={stats.queued} sub="Jobs waiting" icon={<Clock size={22} className="text-warning-soft" />} bg="bg-warning-bg" />
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] text-muted flex items-center gap-2"><span className="h-8 w-8 rounded-lg bg-teal-50 grid place-items-center"><Boxes size={18} className="text-teal" /></span>Processing</div>
              <div className="text-[30px] font-semibold mt-1">{stats.processing}</div>
              <div className="text-[12.5px] text-muted">Active jobs</div>
            </div>
            <div className="text-center">
              <Donut value={stats.avg_progress_pct} size={56} color="#0F8C7F" />
              <div className="text-[11px] text-muted mt-1">Avg. Progress</div>
            </div>
          </div>
        </Card>
        <QueueStat title="Completed Today" value={stats.completed_today} sub="Jobs completed" icon={<CheckCircle2 size={22} className="text-success" />} bg="bg-success-bg" />
        <QueueStat title="Failed" value={stats.failed} sub="Jobs failed" icon={<AlertOctagon size={22} className="text-danger" />} bg="bg-danger-bg" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-10" placeholder="Search by Job ID or Project" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[["all", "All"], ["processing", "Processing"], ["queued", "Queued"], ["completed", "Completed"], ["failed", "Failed"]]} />
          <FilterSelect label="Project" value="all" onChange={() => {}} options={[["all", "All Projects"]]} />
          <div>
            <div className="field-label">Date Range</div>
            <button className="input flex items-center gap-2 w-[220px]"><Calendar size={16} className="text-muted" /> May 18, 2024 - May 21, 2024</button>
          </div>
          <button onClick={refetch} className="h-11 w-11 grid place-items-center rounded-lg border border-line-strong hover:bg-canvas transition"><RefreshCw size={17} className="text-ink-soft" /></button>
        </div>
      </Card>

      {/* Main split */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-muted border-b border-line bg-canvas/40">
                  <th className="px-4 py-3 font-medium">Job ID</th>
                  <th className="px-2 py-3 font-medium">Project</th>
                  <th className="px-2 py-3 font-medium">Preview (LR → SR)</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Compute Node</th>
                  <th className="px-2 py-3 font-medium">Started</th>
                  <th className="px-2 py-3 font-medium">Est. Completion</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, idx) => (
                  <JobRow key={j.job_id} job={j} expanded={idx === 0 && j.status === "processing"} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-line text-[13px]">
            <span className="text-muted">Showing 1 to {jobs.length} of {data.total} jobs</span>
            <div className="flex items-center gap-1">
              <PageBtn><ChevronLeft size={15} /></PageBtn>
              <PageBtn active>1</PageBtn>
              <PageBtn>2</PageBtn>
              <PageBtn>3</PageBtn>
              <PageBtn><ChevronRight size={15} /></PageBtn>
            </div>
            <div className="flex items-center gap-2 text-muted">
              Rows per page
              <span className="inline-flex items-center gap-1 border border-line-strong rounded-md px-2 py-1">10 <ChevronDown size={13} /></span>
            </div>
          </div>
        </Card>

        {/* GPU Cluster panel */}
        <Card className="p-5 h-fit">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5"><h3 className="text-[15px] font-semibold">GPU Cluster Load</h3><Info size={14} className="text-muted" /></div>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-teal"><span className="h-2 w-2 rounded-full bg-teal" /> Healthy</span>
          </div>
          <div className="text-[12.5px] text-muted mt-3">Overall Utilization</div>
          <div className="text-[34px] font-semibold leading-none">{cluster.overall_utilization_pct}%</div>
          <div className="text-[12px] text-muted">Average</div>
          <div className="mt-2"><UtilizationChart data={cluster.trend} /></div>

          <div className="text-[12.5px] text-muted mt-4 mb-2">Node Utilization</div>
          <div className="space-y-3">
            {cluster.nodes.map((n) => (
              <div key={n.name}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="text-ink-soft">{n.name}</span>
                  <span className="font-medium text-ink">{n.utilization_pct}%</span>
                </div>
                <ProgressBar value={n.utilization_pct} tone={n.utilization_pct > 60 ? "teal" : "warning"} />
              </div>
            ))}
          </div>
          <button className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-primary text-[13.5px] font-medium">
            View Cluster Details <ArrowRight size={15} />
          </button>
        </Card>
      </div>
    </div>
  );
}

async function downloadJob(id: string) {
  const t = toast("Preparing job manifest…", "loading");
  try {
    await downloadFile(api.reports.job(id), `job-manifest-${id}.pdf`);
    updateToast(t, "Job manifest downloaded (PDF)", "success");
  } catch (e) {
    updateToast(t, e instanceof Error ? e.message : "Download failed", "error");
  }
}

function JobRow({ job, expanded }: { job: JobDetail; expanded?: boolean }) {
  return (
    <>
      <tr className={cn("border-b border-line", expanded && "border-b-0")}>
        <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{job.job_id}</td>
        <td className="px-2 py-3 text-ink-soft whitespace-nowrap">{job.project}</td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-1.5">
            <div className="h-9 w-9 rounded overflow-hidden"><SatelliteTile seed={job.lr_thumb ?? job.job_id} variant="lr" className="h-full w-full" /></div>
            <ArrowRight size={13} className="text-muted" />
            <div className="h-9 w-9 rounded overflow-hidden"><SatelliteTile seed={job.sr_thumb ?? job.job_id} variant="sr" className="h-full w-full" /></div>
          </div>
        </td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            {job.status === "failed" && <button className="text-[12px] px-2 py-1 rounded border border-line-strong hover:bg-canvas">Retry</button>}
          </div>
          {job.status === "processing" && (
            <div className="mt-1.5 flex items-center gap-2 w-[130px]"><ProgressBar value={job.progress ?? 0} /><span className="text-[11px] text-muted">{job.progress}%</span></div>
          )}
        </td>
        <td className="px-2 py-3 text-ink-soft whitespace-nowrap"><div>{job.compute_node}</div><div className="text-[11px] text-muted">{job.gpu}</div></td>
        <td className="px-2 py-3 text-ink-soft whitespace-nowrap text-[12.5px]">{job.started}</td>
        <td className="px-2 py-3 text-ink-soft whitespace-nowrap text-[12.5px]">{job.eta}</td>
        <td className="px-4 py-3">
          {job.status === "completed"
            ? <button title="Download job manifest (PDF)" onClick={() => downloadJob(job.job_id)} className="h-8 w-8 grid place-items-center rounded-md border border-line hover:bg-canvas hover:border-primary/40 hover:text-primary transition"><Download size={15} /></button>
            : <button title="More actions" className="h-8 w-8 grid place-items-center rounded-md border border-line hover:bg-canvas transition"><MoreHorizontal size={15} /></button>}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-line">
          <td colSpan={8} className="px-4 pb-4">
            <div className="rounded-xl bg-canvas/60 border border-line p-4 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
              <StageTracker job={job} />
              <div className="text-[13px] space-y-2.5 lg:border-l lg:border-line lg:pl-6">
                <Row label="Tiles Processed" value={`${job.tiles_processed.toLocaleString()} / ${job.tiles_total.toLocaleString()}`} />
                <Row label="Data Throughput" value={`${job.throughput_mbps} MB/s`} />
                <Row label="ETA" value={job.eta ?? "—"} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StageTracker({ job }: { job: JobDetail }) {
  return (
    <div className="flex items-start">
      {job.stages.map((s, i) => {
        const done = s.state === "completed";
        const active = s.state === "in_progress";
        return (
          <div key={s.name} className="flex-1 flex flex-col items-center relative">
            {i < job.stages.length - 1 && (
              <div className={cn("absolute top-3.5 left-1/2 w-full h-0.5", done ? "bg-teal" : active ? "bg-gradient-to-r from-primary to-line" : "bg-line")} />
            )}
            <div className={cn("relative z-10 h-7 w-7 rounded-full grid place-items-center",
              done ? "bg-teal text-white" : active ? "bg-primary text-white" : "bg-white border border-line-strong text-muted")}>
              {done ? <Check size={15} /> : active ? <MoreHorizontal size={15} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </div>
            <div className="text-center mt-2">
              <div className={cn("text-[12.5px] font-medium", active ? "text-primary" : "text-ink")}>{s.name}</div>
              <div className="text-[11px] text-muted">{s.detail}</div>
              {active && s.progress != null && <div className="text-[11px] text-primary font-medium">{s.progress}%</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-medium text-ink">{value}</span></div>;
}

function QueueStat({ title, value, sub, icon, bg }: { title: string; value: number; sub: string; icon: React.ReactNode; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center shrink-0", bg)}>{icon}</div>
        <div>
          <div className="text-[13px] text-muted">{title}</div>
          <div className="text-[30px] font-semibold leading-tight">{value}</div>
          <div className="text-[12.5px] text-muted">{sub}</div>
        </div>
      </div>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="relative">
        <select className="select w-[180px]" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
    </div>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={cn("h-8 min-w-8 px-2 grid place-items-center rounded-md text-[13px] transition",
      active ? "bg-primary text-white" : "border border-line hover:bg-canvas text-ink-soft")}>
      {children}
    </button>
  );
}
