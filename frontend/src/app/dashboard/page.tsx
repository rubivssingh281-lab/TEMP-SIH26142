"use client";

import Link from "next/link";
import {
  Layers,
  Briefcase,
  CheckCircle2,
  Database,
  RefreshCw,
  Plus,
  UploadCloud,
  FolderPlus,
  ArrowRight,
  ChevronRight,
  MapPin,
  CalendarDays,
  Box,
  Maximize2,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { Card, Donut, ProgressBar, StatusBadge, Button, SectionTitle } from "@/components/ui/Primitives";
import { Sparkline } from "@/components/ui/Charts";
import { SatelliteTile, HeatmapTile } from "@/components/map/SatelliteTile";
import { MapCanvas } from "@/components/map/MapCanvas";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, error, loading, refetch } = useFetch(() => api.getDashboard());

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} /></div>;
  if (!data) return null;

  const { stats, system_status: sys, recent_job: rj, recent_jobs, last_updated } = data;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-end gap-2 text-[13px] text-muted">
        <span>Last updated: {last_updated}</span>
        <button onClick={refetch} className="h-7 w-7 grid place-items-center rounded-md hover:bg-canvas transition">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi title="Total Projects" value={stats.total_projects} sub={`${stats.active_projects} active`} icon={<Layers size={22} className="text-primary" />} iconBg="bg-primary-50" />
        <Kpi title="Total Jobs" value={stats.total_jobs} sub={`${stats.completed_jobs} completed`} icon={<Briefcase size={22} className="text-teal" />} iconBg="bg-teal-50" />
        <Kpi
          title="Processing"
          value={stats.processing_jobs}
          sub="In queue / running"
          right={<Donut value={62} size={52} color="#0F8C7F" showLabel={false} />}
        />
        <Kpi title="Completed" value={stats.completed_this_month} sub="This month" icon={<CheckCircle2 size={22} className="text-success" />} iconBg="bg-success-bg" />
        <StorageKpi used={stats.storage_used_tb} total={stats.storage_total_tb} />
      </div>

      {/* Middle */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-[17px] font-semibold">Recent Job: {rj.job_id}</h3>
            <StatusBadge status={rj.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <ImagePanel label="Low Resolution (Sentinel-2)" chip={rj.lr_resolution}>
              <SatelliteTile seed={rj.lr_image} variant="lr" className="h-full w-full" />
            </ImagePanel>
            <div className="hidden md:flex items-center justify-center relative">
              <ArrowBubble className="-left-4" />
              <ImagePanelInner label="Super-Resolved (भू DRISTI)" chip={rj.sr_resolution}>
                <SatelliteTile seed={rj.sr_image} variant="sr" className="h-full w-full" />
              </ImagePanelInner>
              <ArrowBubble className="-right-4" />
            </div>
            <ImagePanel label="Uncertainty Map" footer="Uncertainty (High)" gradientFooter>
              <HeatmapTile seed={rj.uncertainty_image} className="h-full w-full" />
            </ImagePanel>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-4 border-t border-line">
            <Meta icon={<Maximize2 size={15} />} label="Area" value={`${rj.area_km2} km²`} />
            <Meta icon={<MapPin size={15} />} label="Location" value={rj.location} />
            <Meta icon={<CalendarDays size={15} />} label="Acquisition Date" value={rj.acquisition_date} />
            <Meta icon={<Box size={15} />} label="Model" value={rj.model} />
            <Meta icon={<TrendingUp size={15} />} label="Resolution Gain" value={rj.resolution_gain} />
          </div>

          <div className="mt-4 text-center">
            <Link href={`/comparison?job=${rj.job_id}`} className="inline-flex items-center gap-1.5 text-primary text-[14px] font-medium hover:gap-2.5 transition-all">
              View in Comparison Viewer <ArrowRight size={16} />
            </Link>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>System Status</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <StatusTile title="GPU Cluster" status="Healthy" statusColor="text-teal">
                <Sparkline data={sys.gpu_cluster.trend} width={120} height={30} />
              </StatusTile>
              <StatusTile title="Storage" status={`${sys.storage.used_pct}% used`} statusColor="text-ink-soft">
                <Sparkline data={sys.storage.trend} width={120} height={30} color="#0F8C7F" />
              </StatusTile>
              <StatusTile title="API Services" status="Operational" statusColor="text-teal" check />
              <StatusTile title="Data Ingestion" status="Active" statusColor="text-teal" check />
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Quick Actions</SectionTitle>
            <Link href="/new-job">
              <Button className="w-full mb-3"><Plus size={18} /> New Enhancement Job</Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="justify-center"><UploadCloud size={17} /> Upload AOI / Data</Button>
              <Link href="/projects"><Button variant="secondary" className="w-full justify-center"><FolderPlus size={17} /> Create New Project</Button></Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle>Project Activity</SectionTitle>
          <MapCanvas
            seed="ladakh-mtn-activity"
            className="h-[320px]"
            scale="20 km"
            controls
            legend={
              <div className="rounded-lg bg-white/95 shadow-sm px-3 py-2.5 text-[12px] space-y-1.5">
                {[
                  ["Completed", "#0F8C7F"],
                  ["Processing", "#0F8C7F"],
                  ["Failed", "#C64545"],
                  ["Queued", "#E0902B"],
                ].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                    <span className="text-ink-soft">{l}</span>
                  </div>
                ))}
              </div>
            }
            overlay={<ActivityPolygons />}
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold">Recent Jobs</h3>
            <Link href="/queue" className="inline-flex items-center gap-1 text-primary text-[13.5px] font-medium">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  <th className="pb-2.5 font-medium">Job ID</th>
                  <th className="pb-2.5 font-medium">Project</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Date</th>
                  <th className="pb-2.5 font-medium">Resolution Gain</th>
                </tr>
              </thead>
              <tbody>
                {recent_jobs.map((j) => (
                  <tr key={j.job_id} className="border-b border-line last:border-0">
                    <td className="py-3 font-medium text-ink whitespace-nowrap">{j.job_id}</td>
                    <td className="py-3 text-ink-soft">{j.project}</td>
                    <td className="py-3"><StatusBadge status={j.status} plain /></td>
                    <td className="py-3 text-ink-soft whitespace-nowrap">{j.date}</td>
                    <td className="py-3 text-ink-soft">{j.resolution_gain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- sub-parts */

function Kpi({
  title, value, sub, icon, iconBg, right,
}: {
  title: string; value: number | string; sub: string; icon?: React.ReactNode; iconBg?: string; right?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] text-muted">{title}</div>
          <div className="text-[30px] font-semibold text-ink leading-tight mt-1">{value}</div>
          <div className="text-[12.5px] text-primary mt-0.5">{sub}</div>
        </div>
        {right ?? (icon && <div className={cn("h-11 w-11 rounded-xl grid place-items-center", iconBg)}>{icon}</div>)}
      </div>
    </Card>
  );
}

function StorageKpi({ used, total }: { used: number; total: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] text-muted">Storage Used</div>
          <div className="text-[30px] font-semibold text-ink leading-tight mt-1">{used} TB</div>
          <div className="text-[12.5px] text-muted mt-0.5">of {total} TB</div>
        </div>
        <div className="h-11 w-11 rounded-xl bg-canvas grid place-items-center"><Database size={22} className="text-ink-soft" /></div>
      </div>
      <ProgressBar value={(used / total) * 100} tone="primary" className="mt-3" />
    </Card>
  );
}

function ImagePanel({ label, chip, footer, gradientFooter, children }: { label: string; chip?: string; footer?: string; gradientFooter?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12.5px] text-ink-soft mb-1.5 text-center">{label}</div>
      <div className="relative rounded-lg overflow-hidden aspect-square bg-[#3a3a2c]">
        {children}
        {chip && <span className="absolute left-2 bottom-2 rounded bg-black/60 px-2 py-1 text-[11px] font-medium text-white">{chip}</span>}
        {footer && (
          <div className="absolute inset-x-0 bottom-0">
            {gradientFooter && <div className="h-2 bg-gradient-to-r from-[#000004] via-[#cf4446] to-[#fcffa4]" />}
            <div className="px-2 py-1 text-[11px] text-white/90 bg-black/40">{footer}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImagePanelInner({ label, chip, children }: { label: string; chip?: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="text-[12.5px] text-ink-soft mb-1.5 text-center">{label}</div>
      <div className="relative rounded-lg overflow-hidden aspect-square bg-[#3a3a2c]">
        {children}
        {chip && <span className="absolute left-2 bottom-2 rounded bg-black/60 px-2 py-1 text-[11px] font-medium text-white">{chip}</span>}
      </div>
    </div>
  );
}

function ArrowBubble({ className }: { className?: string }) {
  return (
    <div className={cn("absolute z-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-white grid place-items-center shadow-md", className)}>
      <ChevronRight size={18} />
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-muted">{label}</div>
        <div className="text-[13px] font-medium text-ink truncate">{value}</div>
      </div>
    </div>
  );
}

function StatusTile({ title, status, statusColor, check, children }: { title: string; status: string; statusColor: string; check?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        {check && <CheckCircle2 size={16} className="text-teal" />}
      </div>
      <div className={cn("text-[12.5px] mt-0.5", statusColor)}>{status}</div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

function ActivityPolygons() {
  const polys = [
    { pts: "16,42 26,36 30,46 22,54 14,52", c: "#0F8C7F" },
    { pts: "34,30 44,26 46,38 38,42", c: "#0F8C7F" },
    { pts: "60,34 68,30 72,44 64,50 58,44", c: "#0F8C7F" },
    { pts: "50,58 60,54 64,68 54,72 48,64", c: "#D6532B" },
    { pts: "68,60 78,58 80,70 70,74", c: "#D6532B" },
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      {polys.map((p, i) => (
        <polygon key={i} points={p.pts} fill={p.c} fillOpacity={0.28} stroke={p.c} strokeWidth={0.7} />
      ))}
    </svg>
  );
}
