"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Pentagon,
  Square,
  Upload,
  ScanLine,
  Clock,
  Database,
  Send,
  Check,
  Network,
  CircleDashed,
  Boxes,
  Layers as LayersIcon,
} from "lucide-react";
import { Card, Button, Checkbox } from "@/components/ui/Primitives";
import { MapCanvas, MapBtn } from "@/components/map/MapCanvas";
import { api } from "@/lib/api";
import { MODEL_OPTIONS, SATELLITE_SOURCES } from "@/lib/mock-data";
import type { ModelType } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const sourceDetail = SATELLITE_SOURCES.find((s) => s.value === source)?.detail;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await api.submitJob({
        project, job_name: jobName, satellite_source: source, model,
        target_resolution_m: resolution,
        bands: [bands.rgb && "RGB", bands.nir && "NIR", bands.swir && "SWIR"].filter(Boolean) as string[],
        aoi_coordinates: [],
      });
      router.push(`/queue?new=${res.job_id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Stepper */}
      <Card className="p-4">
        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-full grid place-items-center text-[13px] font-semibold shrink-0",
                  i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white" : "bg-canvas text-muted border border-line")}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={cn("text-[14px] whitespace-nowrap", i === step ? "text-primary font-semibold" : "text-ink-soft")}>
                  {i + 1}. {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-line mx-4" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: AOI */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-semibold">Area of Interest (AOI)</h3>
                <Info size={15} className="text-muted" />
              </div>
              <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-line-strong text-[13px] text-ink-soft hover:bg-canvas transition">
                <ScanLine size={15} /> AOI Details
              </button>
            </div>
            <MapCanvas
              seed="ladakh-mtn-aoi"
              className="h-[440px]"
              scale="10 km"
              coordinate="34.2345° N, 77.5612° E"
              controls
              toolbar={
                <>
                  <MapBtn active><Pentagon size={16} /></MapBtn>
                  <MapBtn><Square size={16} /></MapBtn>
                  <MapBtn><Upload size={16} /></MapBtn>
                </>
              }
              overlay={
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <polygon
                    points="30,42 52,30 68,38 60,64 40,70 26,56"
                    fill="#D6532B" fillOpacity={0.32} stroke="#D6532B" strokeWidth={0.9}
                  />
                  {[[30, 42], [52, 30], [68, 38], [60, 64], [40, 70], [26, 56]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={1.4} fill="#fff" stroke="#D6532B" strokeWidth={0.8} />
                  ))}
                </svg>
              }
            />
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[16px] font-semibold">Estimated Processing</h3>
              <Info size={15} className="text-muted" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Estimate icon={<Square className="text-primary" size={18} />} label="Estimated Area" value="12.64 km²" />
              <Estimate icon={<Clock className="text-teal" size={18} />} label="Estimated Time" value="2h 18m" note="(Queue dependent)" />
              <Estimate icon={<Database className="text-teal" size={18} />} label="Estimated Storage" value="48.6 GB" note="(Output + Artifacts)" />
            </div>
          </Card>
        </div>

        {/* Right: Job Configuration */}
        <Card className="p-5 flex flex-col">
          <h3 className="text-[17px] font-semibold mb-4">Job Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Project" required>
              <select className="select" value={project} onChange={(e) => setProject(e.target.value)}>
                <option>Ladakh Border Infrastructure</option>
                <option>Arunachal Outposts</option>
                <option>Siachen Glacier Study</option>
              </select>
            </Field>
            <Field label="Job Name" required>
              <input className="input" value={jobName} onChange={(e) => setJobName(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Satellite Source" required>
              <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
                {SATELLITE_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-line-strong px-3.5 h-11 flex items-center gap-2.5">
                <ScanLine size={17} className="text-muted shrink-0" />
                <div className="leading-tight">
                  <div className="text-[13px] font-medium text-ink">{sourceDetail?.split(" · ")[0]}</div>
                  <div className="text-[11px] text-muted">{sourceDetail?.split(" · ")[1]}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model selector */}
          <div className="mt-5">
            <label className="field-label">Model Selector <span className="text-primary">*</span></label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {MODEL_OPTIONS.map((m) => {
                const Icon = MODEL_ICONS[m.key];
                const active = model === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setModel(m.key)}
                    className={cn("text-left rounded-xl border p-3 transition relative",
                      active ? "border-primary bg-primary-50/50 ring-1 ring-primary/30" : "border-line hover:border-line-strong")}
                  >
                    <span className={cn("absolute right-3 top-3 h-4 w-4 rounded-full border grid place-items-center",
                      active ? "border-primary" : "border-line-strong")}>
                      {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <Icon size={26} className={cn("mb-6", active ? "text-primary" : "text-teal")} />
                    <div className="text-[14px] font-semibold text-ink">{m.name}</div>
                    <div className="text-[11.5px] text-muted mt-1 leading-snug">{m.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target resolution */}
          <div className="mt-5">
            <label className="field-label">Target Resolution</label>
            <input
              type="range" min={2.5} max={10} step={0.5} value={12.5 - resolution}
              onChange={(e) => setResolution(12.5 - Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[12px] text-muted mt-1">
              <span>10m (Native)</span>
              <span className="text-primary font-semibold text-[14px]">{resolution.toFixed(1)}m</span>
              <span>2.5m</span>
            </div>
          </div>

          {/* Band selection */}
          <div className="mt-5">
            <label className="field-label">Band Selection <span className="text-primary">*</span></label>
            <div className="flex flex-wrap gap-5">
              <Checkbox checked={bands.rgb} onChange={(v) => setBands((b) => ({ ...b, rgb: v }))} label="RGB (B2, B3, B4)" />
              <Checkbox checked={bands.nir} onChange={(v) => setBands((b) => ({ ...b, nir: v }))} label="NIR (B8)" />
              <Checkbox checked={bands.swir} onChange={(v) => setBands((b) => ({ ...b, swir: v }))} label="SWIR (B11, B12)" />
            </div>
            <p className="text-[12px] text-muted mt-2">Selected bands will be used for model training and inference.</p>
          </div>

          <div className="mt-auto pt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              <Send size={16} /> {submitting ? "Submitting…" : "Submit Job"}
            </Button>
          </div>
        </Card>
      </div>
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
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-canvas grid place-items-center shrink-0">{icon}</div>
      <div>
        <div className="text-[12px] text-muted">{label}</div>
        <div className="text-[17px] font-semibold text-ink">{value}</div>
        {note && <div className="text-[11px] text-muted">{note}</div>}
      </div>
    </div>
  );
}
