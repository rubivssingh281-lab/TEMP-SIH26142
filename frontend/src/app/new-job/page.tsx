"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Info,
  Clock,
  Database,
  Send,
  Check,
  Network,
  CircleDashed,
  Boxes,
  Layers as LayersIcon,
  X,
  MapPin,
  ScanLine,
  Square,
  Lock,
} from "lucide-react";
import { Card, Button, Checkbox } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { MODEL_OPTIONS, SATELLITE_SOURCES } from "@/lib/mock-data";
import type { ModelType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { AoiData } from "@/components/map/LeafletAoiMap";
import { captureAoiMapSnapshot, isWithinAsiaDomain } from "@/components/map/LeafletAoiMap";

// Dynamically import LeafletAoiMap (Leaflet requires browser window APIs)
const LeafletAoiMap = dynamic(
  () => import("@/components/map/LeafletAoiMap").then((mod) => mod.LeafletAoiMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] sm:h-[420px] w-full rounded-xl bg-canvas flex flex-col items-center justify-center border border-line gap-2">
        <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted text-[12px] font-medium">Initializing Leaflet Satellite Map…</span>
      </div>
    ),
  }
);

const STEPS = ["Select AOI", "Upload/Select Imagery", "Configure Model", "Review & Submit"];
const MODEL_ICONS: Record<ModelType, React.ElementType> = { gan: Boxes, diffusion: CircleDashed, transformer: Network, cnn: LayersIcon };

export default function NewJobPage() {
  const router = useRouter();
  const [step] = useState(0);
  const [model, setModel] = useState<ModelType>("gan");
  const [resolution, setResolution] = useState(2.5);
  const [bands, setBands] = useState({ rgb: true, nir: true, swir: false });
  const [project, setProject] = useState("Ladakh Border Infrastructure");
  const [jobName, setJobName] = useState("SR_v2_Ladakh_AOI_01");
  const [source, setSource] = useState("sentinel-2");
  const [submitting, setSubmitting] = useState(false);
  const [showAoiModal, setShowAoiModal] = useState(false);

  // Live locked AOI from Leaflet Map
  const [aoi, setAoi] = useState<AoiData>({
    coordinates: [
      [34.246, 77.545],
      [34.251, 77.575],
      [34.238, 77.592],
      [34.221, 77.578],
      [34.217, 77.548],
    ],
    centroid: { lat: 34.2345, lng: 77.5612 },
    formattedLocation: "34.2345° N, 77.5612° E",
    areaKm2: 12.64,
    isLocked: true,
    regionName: "Ladakh Sector 4B Ridge",
  });

  const sourceDetail = SATELLITE_SOURCES.find((s) => s.value === source)?.detail;

  // Dynamic estimate calculations based on live locked AOI
  const estimatedMinutes = Math.max(18, Math.round(aoi.areaKm2 * 11));
  const estimatedTimeStr = `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;
  const estimatedStorageGb = (aoi.areaKm2 * 3.85).toFixed(1);

  async function submit() {
    setSubmitting(true);
    try {
      // Validate that AOI coordinates are within the Asian training domain
      const isOutsideAsia = aoi.coordinates.some(([lat, lng]) => !isWithinAsiaDomain(lat, lng));
      if (isOutsideAsia) {
        toast("The GeoSRNet CNN model was trained exclusively on the Asia Satellite Dataset. Please ensure the Area of Interest is within Asia (25°E–180°E, 12°S–82°N).", "error");
        setSubmitting(false);
        return;
      }

      let snapshotBase64 = aoi.snapshotBase64;
      if (!snapshotBase64) {
        snapshotBase64 = await captureAoiMapSnapshot(aoi.coordinates, null, aoi.regionName);
      }
      const res = await api.submitJob({
        project,
        job_name: jobName,
        satellite_source: source,
        model,
        target_resolution_m: resolution,
        bands: [bands.rgb && "RGB", bands.nir && "NIR", bands.swir && "SWIR"].filter(Boolean) as string[],
        aoi_coordinates: aoi.coordinates,
        area_km2: aoi.areaKm2,
        location: aoi.formattedLocation,
        bounds: aoi.bounds,
        snapshot_base64: snapshotBase64,
      });
      toast(`Job ${res.job_id} scheduled for ${aoi.formattedLocation} (${aoi.areaKm2} km²)! AOI map snapshot captured for GeoSRNet enhancement.`, "success");
      router.push(`/queue?new=${res.job_id}`);
    } catch (err: any) {
      toast(err?.message || "Failed to submit job", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const copyGeoJson = () => {
    if (aoi.coordinates.length < 3) return;
    const ring = [
      ...aoi.coordinates.map(([lat, lng]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
      [Number(aoi.coordinates[0][1].toFixed(5)), Number(aoi.coordinates[0][0].toFixed(5))],
    ];
    const geojson = {
      type: "Feature",
      properties: {
        name: aoi.regionName || "Locked AOI",
        area_km2: aoi.areaKm2,
        centroid: aoi.formattedLocation,
        crs: "EPSG:4326",
      },
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    };
    navigator.clipboard.writeText(JSON.stringify(geojson, null, 2));
    toast("Locked AOI GeoJSON copied to clipboard!", "success");
  };

  return (
    <div className="p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 min-w-0 w-full">
      {/* Stepper */}
      <Card className="p-2.5 sm:p-4">
        {/* Mobile Stepper (< sm) */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-white grid place-items-center text-[11px] font-semibold">
              {step + 1}
            </div>
            <div>
              <div className="text-[10px] text-muted font-medium">Step {step + 1} of {STEPS.length}</div>
              <div className="text-[12.5px] font-semibold text-primary">{STEPS[step]}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-4 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-line-strong"
                )}
              />
            ))}
          </div>
        </div>

        {/* Desktop Stepper (>= sm) */}
        <div className="hidden sm:flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={cn("h-8 w-8 rounded-full grid place-items-center text-[13px] font-semibold shrink-0",
                  i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white" : "bg-canvas text-muted border border-line")}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={cn("text-[13.5px] whitespace-nowrap", i === step ? "text-primary font-semibold" : "text-ink-soft")}>
                  {i + 1}. {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-line mx-3" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
        {/* Left: AOI Leaflet Map & Estimates */}
        <div className="space-y-3 sm:space-y-5">
          <Card className="p-2.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[14px] sm:text-[17px] font-semibold flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  Area of Interest (AOI)
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Leaflet Live
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAoiModal(true)}
                className="inline-flex items-center gap-1 h-7 sm:h-9 px-2 sm:px-3 rounded-lg border border-line-strong text-[11px] sm:text-[13px] text-ink-soft hover:bg-canvas hover:text-primary transition"
              >
                <ScanLine size={13} /> Details
              </button>
            </div>

            {/* Interactive Leaflet Map */}
            <LeafletAoiMap
              className="h-[220px] sm:h-[420px]"
              initialPreset="ladakh"
              onAoiChange={(newAoi) => {
                setAoi(newAoi);
              }}
            />

            {/* Bottom mini-caption */}
            <div className="flex items-center justify-between text-[11px] text-muted mt-2 px-0.5">
              <span className="flex items-center gap-1">
                <Lock size={11} className="text-primary" />
                Locked: <strong className="text-ink">{aoi.formattedLocation}</strong>
              </span>
              <span>Esri World Imagery 0.5m API</span>
            </div>

            {/* AOI Snapshot Preview Badge */}
            {aoi.snapshotBase64 && (
              <div className="mt-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={aoi.snapshotBase64}
                    alt="AOI Map Snapshot"
                    className="h-10 w-10 rounded border border-emerald-300 object-cover shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-emerald-950 flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      AOI Map Snapshot Captured (512×512)
                    </div>
                    <div className="text-[11px] text-emerald-700 truncate">
                      Extracted from locked bounds · Ready for GeoSRNet 4× inference
                    </div>
                  </div>
                </div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300/60 shrink-0">
                  Active
                </span>
              </div>
            )}
          </Card>

          {/* Real-time Estimated Processing Card (Sideways 3-box on mobile) */}
          <Card className="p-2.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13.5px] sm:text-[16px] font-semibold">Estimated Processing</h3>
                <Info size={14} className="text-muted" />
              </div>
              <span className="text-[11px] text-muted">Auto-computed from AOI</span>
            </div>
            {/* Sideways compact 3 estimates */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
              <Estimate
                icon={<Square className="text-primary" size={15} />}
                label="Area"
                value={`${aoi.areaKm2} km²`}
                note={aoi.isLocked ? "Locked AOI" : "Adjusting"}
              />
              <Estimate
                icon={<Clock className="text-teal" size={15} />}
                label="Time"
                value={estimatedTimeStr}
                note="Queue dep."
              />
              <Estimate
                icon={<Database className="text-teal" size={15} />}
                label="Storage"
                value={`${estimatedStorageGb} GB`}
                note="Artifacts"
              />
            </div>
          </Card>
        </div>

        {/* Right: Job Configuration */}
        <Card className="p-2.5 sm:p-5 flex flex-col">
          <h3 className="text-[14px] sm:text-[17px] font-semibold mb-2.5 sm:mb-4">Job Configuration</h3>

          {/* Sideways 2-column project and job name on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Field label="Project" required>
              <select className="select h-9 sm:h-11 text-[11.5px] sm:text-[14px]" value={project} onChange={(e) => setProject(e.target.value)}>
                <option>Ladakh Border Infrastructure</option>
                <option>Arunachal Outposts</option>
                <option>Siachen Glacier</option>
                <option>Thar Strategic Border</option>
              </select>
            </Field>
            <Field label="Job Name" required>
              <input className="input h-9 sm:h-11 text-[11.5px] sm:text-[14px]" value={jobName} onChange={(e) => setJobName(e.target.value)} />
            </Field>
          </div>

          {/* Sideways 2-column source and details on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4">
            <Field label="Satellite Source" required>
              <select className="select h-9 sm:h-11 text-[11.5px] sm:text-[14px]" value={source} onChange={(e) => setSource(e.target.value)}>
                {SATELLITE_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-line-strong px-2 sm:px-3.5 h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2.5">
                <ScanLine size={14} className="text-muted shrink-0" />
                <div className="leading-tight min-w-0">
                  <div className="text-[11px] sm:text-[13px] font-medium text-ink truncate">{sourceDetail?.split(" · ")[0]}</div>
                  <div className="text-[9.5px] sm:text-[11px] text-muted truncate">{sourceDetail?.split(" · ")[1]}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model selector: 2x2 grid on mobile */}
          <div className="mt-3 sm:mt-5">
            <label className="field-label text-[11px] sm:text-[13px] mb-1">Model Selector <span className="text-primary">*</span></label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {MODEL_OPTIONS.map((m) => {
                const Icon = MODEL_ICONS[m.key];
                const active = model === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModel(m.key)}
                    className={cn("text-left rounded-lg sm:rounded-xl border p-2 sm:p-3 transition relative",
                      active ? "border-primary bg-primary-50/50 ring-1 ring-primary/30" : "border-line hover:border-line-strong")}
                  >
                    <span className={cn("absolute right-2 top-2 sm:right-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border grid place-items-center",
                      active ? "border-primary" : "border-line-strong")}>
                      {active && <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />}
                    </span>
                    <Icon size={18} className={cn("mb-1 sm:mb-4 sm:size-[24px]", active ? "text-primary" : "text-teal")} />
                    <div className="text-[12px] sm:text-[14px] font-semibold text-ink leading-tight">{m.name}</div>
                    <div className="text-[9.5px] sm:text-[11.5px] text-muted mt-0.5 sm:mt-1 leading-snug line-clamp-2">{m.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target resolution */}
          <div className="mt-3 sm:mt-5">
            <div className="flex items-center justify-between mb-1">
              <label className="field-label text-[11px] sm:text-[13px] mb-0">Target Resolution</label>
              <span className="text-primary font-semibold text-[13px] sm:text-[14px]">{resolution.toFixed(1)}m</span>
            </div>
            <input
              type="range" min={2.5} max={10} step={0.5} value={12.5 - resolution}
              onChange={(e) => setResolution(12.5 - Number(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
            <div className="flex justify-between text-[10.5px] sm:text-[12px] text-muted mt-0.5">
              <span>10m (Native)</span>
              <span>2.5m (4x)</span>
            </div>
          </div>

          {/* Band selection: 3 side-by-side checkboxes */}
          <div className="mt-3 sm:mt-5">
            <label className="field-label text-[11px] sm:text-[13px] mb-1">Band Selection <span className="text-primary">*</span></label>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-5">
              <Checkbox checked={bands.rgb} onChange={(v) => setBands((b) => ({ ...b, rgb: v }))} label="RGB" />
              <Checkbox checked={bands.nir} onChange={(v) => setBands((b) => ({ ...b, nir: v }))} label="NIR" />
              <Checkbox checked={bands.swir} onChange={(v) => setBands((b) => ({ ...b, swir: v }))} label="SWIR" />
            </div>
          </div>

          <div className="mt-auto pt-3 sm:pt-6 flex flex-row justify-end gap-2 sm:gap-3">
            <Button variant="secondary" className="flex-1 sm:flex-initial h-8 sm:h-11 text-[12px] sm:text-[14px]" onClick={() => router.push("/dashboard")}>Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1 sm:flex-initial justify-center h-8 sm:h-11 text-[12px] sm:text-[14px] gap-1.5">
              <Send size={14} /> {submitting ? "Submitting…" : "Submit Job"}
            </Button>
          </div>
        </Card>
      </div>

      {/* AOI Details Modal */}
      {showAoiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="text-primary" size={20} />
                <h3 className="text-[17px] font-semibold text-ink">Area of Interest (AOI) Specifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAoiModal(false)}
                className="h-8 w-8 rounded-lg hover:bg-canvas grid place-items-center text-muted hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-canvas">
                <div>
                  <span className="text-muted block text-[11px]">Region Target</span>
                  <span className="font-semibold text-ink">{aoi.regionName || "Locked AOI"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Calculated Surface Area</span>
                  <span className="font-semibold text-primary">{aoi.areaKm2} km²</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Centroid Coordinates</span>
                  <span className="font-mono text-ink text-[12px]">{aoi.formattedLocation}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Coordinate Reference (CRS)</span>
                  <span className="font-mono text-ink text-[12px]">EPSG:4326 (WGS84)</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-ink block mb-1.5">
                  Polygon Boundary Vertices ({aoi.coordinates.length} Nodes):
                </span>
                <div className="rounded-lg border border-line p-2.5 font-mono text-[11px] text-muted space-y-1 bg-white max-h-36 overflow-y-auto">
                  {aoi.coordinates.map(([lat, lng], i) => (
                    <div key={i}>
                      {i + 1}. [{lat.toFixed(4)}° N, {lng.toFixed(4)}° E]
                    </div>
                  ))}
                  {aoi.coordinates.length > 0 && (
                    <div className="text-primary font-semibold">
                      {aoi.coordinates.length + 1}. [{aoi.coordinates[0][0].toFixed(4)}° N, {aoi.coordinates[0][1].toFixed(4)}° E] (Closure)
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-800">
                ✓ <strong>Sentinel Tile Overlap:</strong> 100% analysis-ready coverage centered on locked bounds. Target resolution {resolution}m.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              <button
                type="button"
                onClick={copyGeoJson}
                className="h-10 px-4 rounded-lg border border-line bg-surface text-[13px] font-medium text-ink hover:bg-canvas transition"
              >
                Copy GeoJSON
              </button>
              <button
                type="button"
                onClick={() => setShowAoiModal(false)}
                className="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-sm transition"
              >
                Confirm AOI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label} {required && <span className="text-primary">*</span>}</label>
      {children}
    </div>
  );
}

function Estimate({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-canvas grid place-items-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] sm:text-[12px] text-muted truncate">{label}</div>
        <div className="text-[13.5px] sm:text-[17px] font-semibold text-ink truncate">{value}</div>
        {note && <div className="text-[9.5px] sm:text-[11px] text-muted truncate">{note}</div>}
      </div>
    </div>
  );
}
