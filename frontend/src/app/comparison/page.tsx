"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  SlidersHorizontal,
  Columns2,
  Layers,
  MoveHorizontal,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Copy,
  ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { downloadFile } from "@/lib/download";
import { toast, updateToast } from "@/components/ui/Toast";
import { CheckCircle2 } from "lucide-react";
import { Card, Toggle } from "@/components/ui/Primitives";
import { SatelliteTile } from "@/components/map/SatelliteTile";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import { cn } from "@/lib/utils";

const VIEW_MODES = [
  { key: "slider", label: "Slider", icon: SlidersHorizontal },
  { key: "side", label: "Side-by-Side", icon: Columns2 },
  { key: "overlay", label: "Overlay", icon: Layers },
  { key: "swipe", label: "Swipe", icon: MoveHorizontal },
];

function ComparisonInner() {
  const params = useSearchParams();
  const jobId = params.get("job") ?? "SR_v2_20240520_1030";
  const { data, error, loading } = useFetch(() => api.getComparison(jobId), [jobId]);

  const [mode, setMode] = useState("slider");
  const [zoom, setZoom] = useState("100%");
  const [sync, setSync] = useState(true);
  const [uncertainty, setUncertainty] = useState(false);
  const [opacity, setOpacity] = useState(60);
  const [grid, setGrid] = useState(true);
  const [divider, setDivider] = useState(50);
  const [activeCrop, setActiveCrop] = useState("a01");
  const [exporting, setExporting] = useState(false);
  const dragging = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const cropStrip = useRef<HTMLDivElement>(null);

  /** Set the divider from a pointer x-position within the viewport. */
  function setDividerFromClientX(clientX: number) {
    const el = viewport.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDivider(Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100)));
  }

  async function exportSnapshot(id: string) {
    if (exporting) return;
    setExporting(true);
    const t = toast("Rendering comparison snapshot…", "loading");
    try {
      await downloadFile(api.reports.comparison(id), `comparison-snapshot-${id}.pdf`);
      updateToast(t, "Snapshot downloaded (PDF)", "success");
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
      {/* Control bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <div className="field-label">Job ID</div>
            <div className="relative">
              <select className="select w-[240px]" defaultValue={jobId}>
                <option>{jobId}</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="field-label">View Mode</div>
            <div className="inline-flex rounded-lg border border-line-strong p-1 gap-1">
              {VIEW_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button key={m.key} onClick={() => setMode(m.key)}
                    className={cn("inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] transition",
                      mode === m.key ? "bg-primary-50 text-primary font-medium" : "text-ink-soft hover:bg-canvas")}>
                    <Icon size={15} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="field-label">Zoom</div>
            <div className="inline-flex rounded-lg border border-line-strong p-1 gap-1">
              {["25%", "100%", "200%"].map((z) => (
                <button key={z} onClick={() => setZoom(z)}
                  className={cn("px-3 h-8 rounded-md text-[13px] transition", zoom === z ? "bg-primary-50 text-primary font-medium" : "text-ink-soft hover:bg-canvas")}>
                  {z}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <div className="field-label flex items-center gap-1">Sync Pan &amp; Zoom <Info size={13} className="text-muted" /></div>
              <Toggle checked={sync} onChange={setSync} />
            </div>
          </div>

          <button
            onClick={() => exportSnapshot(jobId)}
            disabled={exporting}
            className="ml-auto inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-primary text-primary text-[14px] font-medium hover:bg-primary-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} /> {exporting ? "Rendering…" : "Export Snapshot"}
          </button>
        </div>
      </Card>

      {/* Viewer + right panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-5">
          {/* Comparison viewport */}
          <div
            ref={viewport}
            className={cn(
              "relative h-[440px] rounded-xl overflow-hidden select-none bg-[#3a3a2c] touch-none",
              mode === "slider" && "cursor-ew-resize"
            )}
            onPointerDown={(e) => {
              if (mode !== "slider") return;
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              setDividerFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging.current && mode === "slider") setDividerFromClientX(e.clientX);
            }}
            onPointerUp={(e) => {
              dragging.current = false;
              e.currentTarget.releasePointerCapture?.(e.pointerId);
            }}
            onPointerCancel={() => (dragging.current = false)}
          >
            {/* SR base (right / bottom layer) */}
            <SatelliteTile seed={data.sr_image} variant="sr" className="absolute inset-0 h-full w-full" />
            <ImgLabel className="right-3 top-3 text-right" title="Super-Resolved (भू DRISTI)" sub={data.sr_resolution} />

            {/* LR clipped by divider (slider) or side-by-side */}
            {mode !== "overlay" && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: mode === "slider" ? `${divider}%` : "50%" }}>
                <div className="absolute inset-0" style={{ width: mode === "slider" ? `${(100 / divider) * 100}%` : "200%", height: "100%" }}>
                  <SatelliteTile seed={data.lr_image} variant="lr" className="absolute inset-0 h-full w-full" />
                </div>
                <ImgLabel className="left-3 top-3" title="Low Resolution (Sentinel-2)" sub={data.lr_resolution} />
              </div>
            )}
            {mode === "overlay" && (
              <div className="absolute inset-0" style={{ opacity: opacity / 100 }}>
                <SatelliteTile seed={data.lr_image} variant="lr" className="absolute inset-0 h-full w-full" />
              </div>
            )}

            {grid && <GridOverlay />}
            {uncertainty && <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/40 via-orange-500/20 to-yellow-300/30 mix-blend-screen" style={{ opacity: opacity / 100 }} />}

            {mode === "slider" && (
              <>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none z-10" style={{ left: `${divider}%` }} />
                <div
                  className="absolute top-1/2 h-10 w-10 rounded-full bg-primary text-white grid place-items-center shadow-lg pointer-events-none z-10"
                  style={{ left: `${divider}%`, transform: "translate(-50%, -50%)" }}
                >
                  <MoveHorizontal size={18} />
                </div>
              </>
            )}
            <span className="absolute right-3 bottom-3 rounded bg-black/55 px-2 py-1 text-[11px] text-white/90">{data.coordinate}</span>
            <span className="absolute left-3 bottom-3 rounded bg-black/55 px-2 py-1 text-[11px] text-white/90">250 m</span>
          </div>

          {/* Quick views */}
          <Card className="p-4">
            <h4 className="text-[14px] font-semibold mb-3">Quick Views / Cropped Areas</h4>
            <div className="flex items-center gap-3">
              <button onClick={() => cropStrip.current?.scrollBy({ left: -220, behavior: "smooth" })} className="h-8 w-8 shrink-0 grid place-items-center rounded-md border border-line hover:bg-canvas transition"><ChevronLeft size={16} /></button>
              <div ref={cropStrip} className="flex gap-3 overflow-x-auto flex-1 pb-1 scroll-smooth">
                {data.crops.map((c) => (
                  <button key={c.id} onClick={() => setActiveCrop(c.id)}
                    className={cn("shrink-0 w-[140px] rounded-lg overflow-hidden border-2 transition", activeCrop === c.id ? "border-primary" : "border-transparent")}>
                    <div className="h-[74px]"><SatelliteTile seed={c.image} variant="sr" className="h-full w-full" /></div>
                    <div className="px-2 py-1.5 text-left bg-surface">
                      <div className="text-[12.5px] font-medium text-ink truncate">{c.label}</div>
                      <div className="text-[11px] text-muted">{c.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => cropStrip.current?.scrollBy({ left: 220, behavior: "smooth" })} className="h-8 w-8 shrink-0 grid place-items-center rounded-md border border-line hover:bg-canvas transition"><ChevronRight size={16} /></button>
            </div>
          </Card>

          {/* Quality metrics */}
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <h4 className="text-[14px] font-semibold">Quality Metrics (vs. Reference / Best Available)</h4>
              <Info size={13} className="text-muted" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.metrics.map((m) => (
                <div key={m.key} className="rounded-lg border-l-[3px] border-teal bg-canvas/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-muted flex items-center gap-1">{m.label} <Info size={12} /></span>
                    {m.pass && <CheckCircle2 size={17} className="text-white fill-success" />}
                  </div>
                  <div className="text-[22px] font-semibold mt-1">{m.value}</div>
                  <div className="text-[11px] text-muted">Threshold: {m.threshold}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right controls */}
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4"><h4 className="text-[15px] font-semibold">Layer Controls</h4><ChevronUp size={16} className="text-muted" /></div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[13.5px] text-ink-soft flex items-center gap-1">Uncertainty Overlay <Info size={12} className="text-muted" /></span>
              <Toggle checked={uncertainty} onChange={setUncertainty} />
            </div>

            <div className="mb-4">
              <div className="text-[12.5px] text-muted mb-1.5">Opacity</div>
              <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[11px] text-muted mt-0.5"><span>0%</span><span className="text-ink font-medium">{opacity}%</span><span>100%</span></div>
            </div>

            <div className="flex items-center justify-between mb-4 pt-2 border-t border-line">
              <span className="text-[13.5px] text-ink-soft">Grid / Coordinates</span>
              <Toggle checked={grid} onChange={setGrid} />
            </div>

            <div>
              <div className="text-[12.5px] text-ink-soft mb-1.5 flex items-center gap-1">Band Combination <Info size={12} className="text-muted" /></div>
              <select className="select"><option>Natural Color (RGB)</option><option>False Color (NIR)</option><option>SWIR Composite</option></select>
              <div className="text-[11.5px] text-muted mt-1.5">Bands: B4, B3, B2</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5"><h4 className="text-[15px] font-semibold">Pixel Inspector</h4><Info size={13} className="text-muted" /></div>
              <ChevronUp size={16} className="text-muted" />
            </div>
            <div className="flex items-center justify-between text-[12.5px] mb-2">
              <span className="text-muted">Coordinate</span>
              <span className="text-ink font-medium flex items-center gap-1">{data.pixel.coordinate} <Copy size={12} className="text-muted" /></span>
            </div>
            <div className="text-[12.5px] text-muted mb-2">Pixel (Super-Resolved)</div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-muted border-b border-line"><th className="text-left pb-1.5 font-medium">Band</th><th className="text-right pb-1.5 font-medium">Reflectance</th></tr></thead>
              <tbody>
                {data.pixel.bands.map((b) => (
                  <tr key={b.band} className="border-b border-line last:border-0"><td className="py-1.5 text-ink-soft">{b.band}</td><td className="py-1.5 text-right font-medium text-ink">{b.reflectance.toFixed(3)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between text-[12.5px] mt-2 pt-2 border-t border-line">
              <span className="text-muted">Valid Data</span>
              <span className="text-teal font-medium inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal" /> {data.pixel.valid ? "Yes" : "No"}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ImgLabel({ title, sub, className }: { title: string; sub: string; className?: string }) {
  return (
    <div className={cn("absolute rounded-md bg-black/55 px-3 py-1.5 text-white z-[1]", className)}>
      <div className="text-[12.5px] font-medium">{title}</div>
      <div className="text-[11px] text-white/80">{sub}</div>
    </div>
  );
}

function GridOverlay() {
  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        <pattern id="cmpgrid" width="12.5%" height="12.5%" patternUnits="userSpaceOnUse">
          <path d="M100 0 H0 V100" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cmpgrid)" />
    </svg>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingState /></div>}>
      <ComparisonInner />
    </Suspense>
  );
}
