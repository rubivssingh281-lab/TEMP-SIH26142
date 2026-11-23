"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Mail,
  Play,
  RotateCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { downloadFile } from "@/lib/download";
import { toast, updateToast } from "@/components/ui/Toast";
import { Card, StatusBadge, Button, ProgressBar } from "@/components/ui/Primitives";
import { UtilizationChart } from "@/components/ui/Charts";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import type { JobDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingState /></div>}>
      <QueuePageContent />
    </Suspense>
  );
}

function QueuePageContent() {
  const searchParams = useSearchParams();
  const newJobParam = searchParams.get("new");

  const [status, setStatus] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [q, setQ] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(newJobParam);

  const { data, error, loading, refetch } = useFetch(() => api.getQueue({ status, q }), [status, q]);

  useEffect(() => {
    if (newJobParam) {
      setExpandedJobId(newJobParam);
    }
  }, [newJobParam]);

  // Live polling whenever any job is processing or queued so progress updates in real time
  useEffect(() => {
    const hasRunning = data?.jobs?.some((j) => j.status === "processing" || j.status === "queued");
    if (!hasRunning) return;
    const interval = setInterval(() => {
      refetch();
    }, 1500);
    return () => clearInterval(interval);
  }, [data?.jobs, refetch]);

  // Auto-expand first processing job when data loads
  const activeJobs = useMemo(() => {
    if (!data?.jobs) return [];
    return data.jobs.filter((j) => {
      const matchProject = projectFilter === "all" || j.project.toLowerCase().includes(projectFilter.toLowerCase());
      return matchProject;
    });
  }, [data?.jobs, projectFilter]);

  if (loading && !data) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} /></div>;
  if (!data) return null;

  const { stats, cluster } = data;

  return (
    <div className="p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 min-w-0 w-full">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-[22px] sm:text-[27px] font-bold tracking-tight text-slate-900">Processing Queue</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Real-time status of super-resolution inference pipelines and GPU compute allocations</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/new-job"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#D2691E] hover:bg-[#b85816] text-white text-[13px] font-semibold shadow-xs transition hover:brightness-105 cursor-pointer"
          >
            <Boxes size={16} /> New Enhancement Job
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (Tabs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Queued */}
        <Card className="p-4 sm:p-5 h-full relative overflow-hidden transition-all duration-200 hover:shadow-md border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] sm:text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Queued</div>
              <div className="text-[26px] sm:text-[34px] font-bold text-slate-900 leading-tight mt-1 tracking-tight">{stats.queued}</div>
              <div className="text-[11.5px] sm:text-[12.5px] text-amber-700 mt-1 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Jobs waiting</span>
              </div>
            </div>
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 grid place-items-center shrink-0 shadow-2xs">
              <Clock size={22} strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {/* Card 2: Active / Running */}
        <Card className="p-4 sm:p-5 h-full relative overflow-hidden transition-all duration-200 hover:shadow-md border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] sm:text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Active</div>
              <div className="text-[26px] sm:text-[34px] font-bold text-slate-900 leading-tight mt-1 tracking-tight">{stats.processing}</div>
              <div className="text-[11.5px] sm:text-[12.5px] text-teal mt-1 font-medium flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
                </span>
                <span>Running ({stats.avg_progress_pct}% avg)</span>
              </div>
            </div>
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-teal-50 text-teal border border-teal-200/60 grid place-items-center shrink-0 shadow-2xs">
              <Boxes size={22} strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {/* Card 3: Completed */}
        <Card className="p-4 sm:p-5 h-full relative overflow-hidden transition-all duration-200 hover:shadow-md border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] sm:text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Completed</div>
              <div className="text-[26px] sm:text-[34px] font-bold text-slate-900 leading-tight mt-1 tracking-tight">{stats.completed_today}</div>
              <div className="text-[11.5px] sm:text-[12.5px] text-emerald-700 mt-1 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Today</span>
              </div>
            </div>
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 grid place-items-center shrink-0 shadow-2xs">
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {/* Card 4: Failed */}
        <Card className="p-4 sm:p-5 h-full relative overflow-hidden transition-all duration-200 hover:shadow-md border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] sm:text-[12.5px] font-semibold text-slate-500 uppercase tracking-wider">Failed</div>
              <div className="text-[26px] sm:text-[34px] font-bold text-slate-900 leading-tight mt-1 tracking-tight">{stats.failed}</div>
              <div className="text-[11.5px] sm:text-[12.5px] text-rose-700 mt-1 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>{stats.failed === 0 ? "Zero errors" : "Errors"}</span>
              </div>
            </div>
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 grid place-items-center shrink-0 shadow-2xs">
              <AlertOctagon size={22} strokeWidth={2.2} />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Filters Bar */}
      <Card className="p-4 sm:p-5 border border-slate-200/90 bg-white shadow-xs">
        {/* Horizontal Status Filter Pills on mobile */}
        <div className="flex overflow-x-auto gap-1.5 pb-2.5 no-scrollbar border-b border-line mb-3 sm:hidden">
          {[
            ["all", "All"],
            ["processing", `Processing (${stats.processing})`],
            ["queued", `Queued (${stats.queued})`],
            ["completed", `Done (${stats.completed_today})`],
            ["failed", `Failed (${stats.failed})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors shrink-0",
                status === key
                  ? "bg-[#D2691E] text-white"
                  : "bg-surface border border-line text-slate-700 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-end">
          {/* Search Field */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Search Queue</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full h-11 pl-10 pr-9 rounded-lg border border-slate-200 bg-white text-[13.5px] text-slate-800 outline-none transition focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10"
                  placeholder="Search by Job ID, Project, or compute node…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={refetch}
                className="h-11 w-11 grid place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition shrink-0 shadow-2xs cursor-pointer"
                title="Refresh queue"
              >
                <RefreshCw size={16} className={cn("transition-transform duration-500", loading && "animate-spin text-[#D2691E]")} />
              </button>
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-2 sm:flex sm:items-end gap-2.5 sm:gap-3">
            <div className="hidden sm:block">
              <FilterSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  ["all", `All (${data.total || data.jobs.length})`],
                  ["processing", `Processing (${stats.processing})`],
                  ["queued", `Queued (${stats.queued})`],
                  ["completed", `Completed (${stats.completed_today})`],
                  ["failed", `Failed (${stats.failed})`],
                ]}
              />
            </div>
            <div>
              <FilterSelect
                label="Project"
                value={projectFilter}
                onChange={setProjectFilter}
                options={[
                  ["all", "All Projects"],
                  ["Ladakh", "Ladakh Border Infra"],
                  ["Arunachal", "Arunachal Outposts"],
                  ["Siachen", "Siachen Glacier Study"],
                  ["Western", "Western Border Roads"],
                ]}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Date Range</label>
              <button
                type="button"
                className="flex items-center justify-between gap-2 w-full sm:w-[175px] h-11 px-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar size={14} className="text-[#D2691E] shrink-0" />
                  <span className="truncate font-medium">May 18 - 21</span>
                </div>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Main Split: Jobs Table & GPU Cluster Load */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 sm:gap-5 min-w-0">
        <Card className="p-0 overflow-hidden border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-left text-slate-600 border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Job ID</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Project</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Preview (LR → SR)</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Compute Node</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Started</th>
                  <th className="px-3 py-3.5 font-semibold text-[11.5px] uppercase tracking-wider">Est. Completion</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-[11.5px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeJobs.map((j, idx) => {
                  const isExpanded = expandedJobId === j.job_id || (expandedJobId === null && idx === 0 && j.status === "processing");
                  return (
                    <JobRow
                      key={j.job_id}
                      job={j}
                      expanded={isExpanded}
                      onToggleExpand={() => setExpandedJobId(isExpanded ? "" : j.job_id)}
                      onRefresh={refetch}
                    />
                  );
                })}
                {activeJobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[13.5px] text-slate-500">
                      No jobs match the specified criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/60 text-[13px]">
            <span className="text-slate-500 font-medium">
              Showing 1 to {activeJobs.length} of {data.total} jobs
            </span>
            <div className="flex items-center gap-1">
              <PageBtn><ChevronLeft size={15} /></PageBtn>
              <PageBtn active>1</PageBtn>
              <PageBtn>2</PageBtn>
              <PageBtn>3</PageBtn>
              <PageBtn><ChevronRight size={15} /></PageBtn>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span>Rows per page</span>
              <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white rounded-md px-2.5 py-1 text-[12px] font-semibold text-slate-800 shadow-2xs">
                10 <ChevronDown size={13} className="text-slate-400" />
              </span>
            </div>
          </div>
        </Card>

        {/* 5. GPU Cluster Load Panel */}
        <Card className="p-5 h-fit border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-slate-900">GPU Cluster Load</h3>
              <Info size={14} className="text-slate-400" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Healthy
            </span>
          </div>

          <div className="mt-3.5 mb-2">
            <div className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Overall Utilization</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[36px] font-extrabold text-slate-950 tracking-tight leading-none">
                {cluster.overall_utilization_pct}%
              </span>
              <span className="text-[12px] font-medium text-slate-500">24h Cluster Avg</span>
            </div>
          </div>

          <div className="mt-3 -mx-2">
            <UtilizationChart data={cluster.trend} />
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <span>Node Allocation</span>
              <span>Load</span>
            </div>
            <div className="space-y-3">
              {cluster.nodes.map((n) => (
                <div key={n.name} className="space-y-1">
                  <div className="flex justify-between text-[12.5px]">
                    <span className="font-mono text-slate-700 font-medium">{n.name}</span>
                    <span className="font-mono font-semibold text-slate-900">{n.utilization_pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        n.utilization_pct > 80 ? "bg-amber-500" : n.utilization_pct > 60 ? "bg-teal" : "bg-emerald-500"
                      )}
                      style={{ width: `${n.utilization_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/cluster"
            className="mt-6 w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#D2691E] font-medium text-[13px] transition group shadow-2xs"
          >
            <span>View Cluster Details</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
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

async function emailJob(id: string) {
  const t = toast("Delivering job manifest via SMTP…", "loading");
  try {
    const res = await api.reports.email("job", id);
    updateToast(t, res.message || "Job manifest delivered via SMTP!", "success");
  } catch (e) {
    updateToast(t, e instanceof Error ? e.message : "SMTP delivery failed", "error");
  }
}

async function simulateCompleteJob(id: string, onRefresh?: () => void) {
  const t = toast("Finalizing inference & dispatching SMTP notification…", "loading");
  try {
    await api.jobs.simulateComplete(id);
    updateToast(t, `Job ${id} completed! Real-time notification dispatched via SMTP.`, "success");
    onRefresh?.();
  } catch (e) {
    updateToast(t, e instanceof Error ? e.message : "Completion failed", "error");
  }
}

function JobRow({
  job,
  expanded,
  onToggleExpand,
  onRefresh,
}: {
  job: JobDetail;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <>
      <tr className={cn("transition-colors hover:bg-slate-50/70", expanded && "bg-slate-50/50")}>
        <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
          <button
            onClick={onToggleExpand}
            className="hover:text-[#D2691E] hover:underline text-left cursor-pointer inline-flex items-center gap-1.5"
            title="Click to toggle pipeline stages"
          >
            <span>{job.job_id}</span>
            <ChevronDown size={13} className={cn("text-slate-400 transition-transform duration-200", expanded && "rotate-180 text-[#D2691E]")} />
          </button>
        </td>
        <td className="px-3 py-3.5 text-slate-800 font-medium whitespace-nowrap">{job.project}</td>
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-1.5">
            <div className="h-9 w-9 rounded-md border border-slate-200 overflow-hidden shadow-2xs relative" title="Low-Resolution Input">
              <SatelliteTile seed={job.lr_thumb ?? job.job_id} variant="lr" className="h-full w-full object-cover" />
            </div>
            <ArrowRight size={13} className="text-slate-400 shrink-0" />
            <div className="h-9 w-9 rounded-md border border-teal/30 overflow-hidden shadow-2xs relative" title="Super-Resolution Output">
              <SatelliteTile seed={job.sr_thumb ?? job.job_id} variant="sr" className="h-full w-full object-cover" />
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            {job.status === "failed" && (
              <button
                onClick={() => {
                  toast(`Re-queuing failed job ${job.job_id}…`, "loading");
                  setTimeout(() => {
                    toast(`Job ${job.job_id} re-staged at priority rank 1!`, "success");
                    onRefresh?.();
                  }, 1200);
                }}
                className="text-[11.5px] px-2 py-0.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <RotateCw size={11} /> Retry
              </button>
            )}
          </div>
          {job.status === "processing" && (
            <div className="mt-1.5 flex items-center gap-2 w-[130px]">
              <ProgressBar value={job.progress ?? 0} tone="teal" />
              <span className="text-[11px] font-semibold text-teal-700">{job.progress}%</span>
            </div>
          )}
        </td>
        <td className="px-3 py-3.5 text-slate-800 whitespace-nowrap">
          <div className="font-semibold text-slate-800 text-[13px]">{job.compute_node}</div>
          <div className="text-[11px] text-slate-500 font-mono">{job.gpu}</div>
        </td>
        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap text-[12.5px] font-medium">{job.started}</td>
        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap text-[12.5px] font-medium">{job.eta}</td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center gap-1.5 justify-end">
            {job.status === "completed" && (
              <>
                <button
                  title="Deliver job manifest via SMTP"
                  onClick={() => emailJob(job.job_id)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal hover:border-teal/50 transition shadow-2xs cursor-pointer"
                >
                  <Mail size={14} />
                </button>
                <button
                  title="Download job manifest (PDF)"
                  onClick={() => downloadJob(job.job_id)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#D2691E] hover:border-[#D2691E]/50 transition shadow-2xs cursor-pointer"
                >
                  <Download size={14} />
                </button>
              </>
            )}
            {job.status === "processing" && (
              <button
                title="Simulate job completion and trigger SMTP notification"
                onClick={() => simulateCompleteJob(job.job_id, onRefresh)}
                className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11.5px] font-semibold hover:bg-emerald-100 transition shadow-2xs whitespace-nowrap cursor-pointer"
              >
                <Play size={12} fill="currentColor" /> Complete &amp; Notify
              </button>
            )}
            {job.status !== "completed" && job.status !== "processing" && (
              <button
                title="Download job manifest (PDF)"
                onClick={() => downloadJob(job.job_id)}
                className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              >
                <Download size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/60">
          <td colSpan={8} className="px-4 pb-4 pt-1">
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-6">
              <StageTracker job={job} />
              <div className="text-[13px] space-y-3 lg:border-l lg:border-slate-200 lg:pl-6 flex flex-col justify-center">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 text-[12.5px]">Tiles Processed</span>
                  <span className="font-mono font-semibold text-slate-900 text-[13px]">
                    {job.tiles_processed.toLocaleString()} / {job.tiles_total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 text-[12.5px]">Data Throughput</span>
                  <span className="font-mono font-semibold text-teal text-[13px]">
                    {job.throughput_mbps} MB/s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[12.5px]">Est. Completion (ETA)</span>
                  <span className="font-semibold text-slate-800 text-[13px] font-mono">
                    {job.eta ?? "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadJob(job.job_id)}
                  className="mt-2.5 w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D2691E]/30 bg-[#D2691E]/10 hover:bg-[#D2691E]/20 text-[#D2691E] text-[12px] font-semibold transition cursor-pointer"
                >
                  <Download size={13} /> Download Detailed Audit Report (PDF)
                </button>
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
    <div className="flex items-start justify-between w-full relative pt-1">
      {job.stages.map((s, i) => {
        const done = s.state === "completed";
        const active = s.state === "in_progress";
        return (
          <div key={s.name} className="flex-1 flex flex-col items-center relative text-center px-1">
            {/* Horizontal line connector */}
            {i < job.stages.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 left-1/2 w-full h-[3px] -z-0",
                  done
                    ? "bg-emerald-500"
                    : active
                    ? "bg-gradient-to-r from-emerald-500 via-[#D2691E] to-slate-200"
                    : "bg-slate-200"
                )}
              />
            )}
            {/* Step Icon Circle */}
            <div
              className={cn(
                "relative z-10 h-8 w-8 rounded-full grid place-items-center transition-all duration-300 shadow-sm",
                done
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : active
                  ? "bg-[#D2691E] text-white ring-4 ring-orange-100 animate-pulse"
                  : "bg-white border-2 border-slate-300 text-slate-400"
              )}
            >
              {done ? (
                <Check size={16} strokeWidth={2.5} />
              ) : active ? (
                <MoreHorizontal size={16} />
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              )}
            </div>
            {/* Step Text Info */}
            <div className="mt-2.5">
              <div className={cn("text-[13px] font-semibold", active ? "text-[#D2691E]" : done ? "text-slate-900" : "text-slate-500")}>
                {s.name}
              </div>
              <div className="text-[11.5px] text-slate-500 mt-0.5">{s.detail}</div>
              {active && s.progress != null && (
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D2691E]/10 text-[#D2691E] inline-flex items-center gap-1">
                  In Progress {s.progress}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <div className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="relative">
        <select
          className="w-full sm:w-[175px] h-11 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-[13px] font-medium text-slate-800 outline-none transition focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10 cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={cn(
        "h-8 min-w-8 px-2 grid place-items-center rounded-lg text-[13px] font-semibold transition cursor-pointer shadow-2xs",
        active
          ? "bg-[#D2691E] text-white"
          : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
      )}
    >
      {children}
    </button>
  );
}
