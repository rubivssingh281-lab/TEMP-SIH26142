"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  MoreVertical,
  ExternalLink,
  Briefcase,
  CalendarDays,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { Card, Donut, ProgressBar, Pill } from "@/components/ui/Primitives";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import { PROJECT_CATEGORIES } from "@/lib/mock-data";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data, error, loading } = useFetch(() => api.getProjects({ category, q }), [category, q]);

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-[24px] font-semibold text-ink">All Projects</h1>
        <div className="relative flex-1 min-w-[240px] max-w-[420px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <div className="text-[11.5px] text-muted mb-0.5">Sort by</div>
          <div className="relative">
            <select className="select w-[160px]"><option>Recent</option><option>Name</option><option>Area</option></select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>
        <div className="inline-flex rounded-lg border border-line-strong p-1 gap-1 self-end">
          <button onClick={() => setView("grid")} className={cn("h-9 w-9 grid place-items-center rounded-md", view === "grid" ? "bg-primary-50 text-primary" : "text-muted")}><LayoutGrid size={17} /></button>
          <button onClick={() => setView("list")} className={cn("h-9 w-9 grid place-items-center rounded-md", view === "list" ? "bg-primary-50 text-primary" : "text-muted")}><List size={17} /></button>
        </div>
        <button className="self-end inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-600 text-white text-[14px] font-medium transition">
          <Plus size={17} /> Create New Project
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {PROJECT_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={cn("h-9 px-4 rounded-lg text-[13.5px] font-medium border transition",
              category === c ? "bg-primary text-white border-primary" : "bg-surface text-ink-soft border-line hover:bg-canvas")}>
            {c}
          </button>
        ))}
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState error={error} /> : data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-min">
            {data.projects.map((p, i) => i === 0 ? <FeaturedCard key={p.id} p={p} /> : <CompactCard key={p.id} p={p} />)}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <PageBtn><ChevronLeft size={15} /></PageBtn>
            {[1, 2, 3, 4, 5].map((n) => <PageBtn key={n} active={n === 1}>{n}</PageBtn>)}
            <span className="px-1 text-muted">…</span>
            <PageBtn>10</PageBtn>
            <PageBtn><ChevronRight size={15} /></PageBtn>
          </div>
        </>
      )}
    </div>
  );
}

function FeaturedCard({ p }: { p: Project }) {
  return (
    <Card className="md:row-span-2 border-primary/40 ring-1 ring-primary/20 overflow-hidden flex flex-col">
      <div className="relative h-[220px]">
        <SatelliteTile seed={p.cover_image} variant="sr" className="h-full w-full" />
        <div className="absolute right-3 top-3"><Pill tone="active">{cap(p.status)}</Pill></div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] font-semibold text-ink">{p.name}</h3>
          <Pill tone="active">{cap(p.status)}</Pill>
        </div>
        <p className="text-[13px] text-muted mt-1.5 leading-snug">{p.description}</p>

        <div className="grid grid-cols-4 gap-2 mt-4 items-center">
          <Stat icon={<Briefcase size={14} />} value={String(p.jobs)} label="Jobs" />
          <Stat icon={<CalendarDays size={14} />} value={p.last_updated} label="Last updated" small />
          <Stat icon={<Maximize2 size={14} />} value={`${p.total_area_km2.toLocaleString()} km²`} label="Total area" small />
          <div className="flex flex-col items-center"><Donut value={p.complete_pct} size={54} /><span className="text-[11px] text-muted mt-1">Complete</span></div>
        </div>

        <div className="mt-5">
          <div className="text-[13px] font-medium text-ink mb-3">Recent Job Runs</div>
          <div className="flex items-center">
            {p.recent_runs.map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center relative">
                {i < p.recent_runs.length - 1 && <div className="absolute top-2 left-1/2 w-full h-0.5 bg-teal/40" />}
                <span className={cn("relative z-10 h-4 w-4 rounded-full border-2 border-white",
                  r.status === "completed" ? "bg-teal" : r.status === "failed" ? "bg-primary" : r.status === "queued" ? "bg-line-strong" : "bg-warning-soft")} />
                <span className="text-[11px] text-muted mt-1.5">{r.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-ink mb-2">Team Members</div>
            <div className="flex -space-x-2">
              {p.team.map((t) => (
                <span key={t.initials} className="h-8 w-8 rounded-full ring-2 ring-white grid place-items-center text-[11px] font-semibold text-white" style={{ background: t.color }}>{t.initials}</span>
              ))}
              <span className="h-8 w-8 rounded-full ring-2 ring-white bg-canvas grid place-items-center text-[11px] font-medium text-ink-soft">+2</span>
            </div>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-primary text-primary text-[14px] font-medium hover:bg-primary-50 transition">
            Open Project <ExternalLink size={15} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function CompactCard({ p }: { p: Project }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative h-[150px]">
        <SatelliteTile seed={p.cover_image} variant="sr" className="h-full w-full" />
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <Pill tone={p.status === "active" ? "active" : "archived"}>{cap(p.status)}</Pill>
          <button className="h-8 w-8 grid place-items-center rounded-md bg-white/95 shadow-sm text-ink-soft"><MoreVertical size={15} /></button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <h3 className="text-[15.5px] font-semibold text-ink">{p.name}</h3>
          <Pill tone={p.status === "active" ? "active" : "archived"}>{cap(p.status)}</Pill>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 items-center">
          <Stat value={String(p.jobs)} label="Jobs" />
          <Stat value={p.last_updated} label="Last updated" small />
          <Stat value={`${p.total_area_km2.toLocaleString()} km²`} label="Total area" small />
          <div className="flex flex-col items-center"><Donut value={p.complete_pct} size={48} /><span className="text-[10.5px] text-muted mt-1">Complete</span></div>
        </div>
        <ProgressBar value={p.complete_pct} className="mt-3" />
      </div>
    </Card>
  );
}

function Stat({ icon, value, label, small }: { icon?: React.ReactNode; value: string; label: string; small?: boolean }) {
  return (
    <div>
      <div className={cn("font-semibold text-ink flex items-center gap-1", small ? "text-[12.5px]" : "text-[16px]")}>
        {icon && <span className="text-muted">{icon}</span>}{value}
      </div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <button className={cn("h-9 min-w-9 px-2 grid place-items-center rounded-md text-[13px]", active ? "bg-primary text-white" : "border border-line hover:bg-canvas text-ink-soft")}>{children}</button>;
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
