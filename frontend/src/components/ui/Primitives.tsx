"use client";

import { cn } from "@/lib/utils";
import type { JobStatus, MetricRating } from "@/lib/types";
import { CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";

/* -------------------------------------------------------------------- Card */
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[17px] font-semibold text-ink">{children}</h3>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------- Status badge */
const STATUS_STYLE: Record<JobStatus, { label: string; cls: string; icon: React.ElementType }> = {
  completed: { label: "Completed", cls: "text-success bg-success-bg", icon: CheckCircle2 },
  done: { label: "Completed", cls: "text-success bg-success-bg", icon: CheckCircle2 },
  processing: { label: "Processing", cls: "text-teal-600 bg-teal-50", icon: Loader2 },
  created: { label: "Created", cls: "text-warning bg-warning-bg", icon: Clock },
  queued: { label: "Queued", cls: "text-warning bg-warning-bg", icon: Clock },
  preprocessing: { label: "Pre-processing", cls: "text-teal-600 bg-teal-50", icon: Loader2 },
  inference: { label: "Inference", cls: "text-teal-600 bg-teal-50", icon: Loader2 },
  postprocessing: { label: "Post-processing", cls: "text-teal-600 bg-teal-50", icon: Loader2 },
  validation: { label: "Validation", cls: "text-teal-600 bg-teal-50", icon: Loader2 },
  failed: { label: "Failed", cls: "text-danger bg-danger-bg", icon: AlertTriangle },
};

export function StatusBadge({ status, plain = false }: { status: JobStatus; plain?: boolean }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["failed"];
  if (plain) {
    return <span className={cn("text-[13px] font-medium", s.cls.split(" ")[0])}>{s.label}</span>;
  }
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-medium", s.cls)}>
      <Icon size={13} className={status === "processing" ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}

/* --------------------------------------------------------------- Pill badge */
export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "active" | "archived" }) {
  const map = {
    neutral: "text-ink-soft bg-canvas border border-line",
    success: "text-success bg-success-bg",
    active: "text-success bg-success-bg",
    archived: "text-ink-soft bg-canvas border border-line",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", map[tone])}>{children}</span>;
}

/* -------------------------------------------------------------- Rating dot */
const RATING: Record<MetricRating, { label: string; color: string }> = {
  excellent: { label: "Excellent", color: "#15803D" },
  good: { label: "Good", color: "#15803D" },
  fair: { label: "Fair", color: "#C77A1E" },
  poor: { label: "Poor", color: "#C64545" },
};
export function RatingChip({ rating }: { rating: MetricRating }) {
  const r = RATING[rating];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2 py-0.5 text-[12px] font-medium text-ink-soft">
      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
      {r.label}
    </span>
  );
}

/* ------------------------------------------------------------------ Button */
export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: { variant?: "primary" | "secondary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-primary hover:bg-primary-600 text-white shadow-sm",
    secondary: "bg-surface border border-line-strong text-ink hover:bg-canvas",
    ghost: "text-ink-soft hover:bg-canvas",
    danger: "bg-danger hover:brightness-95 text-white",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- ProgressBar */
export function ProgressBar({ value, tone = "teal", className }: { value: number; tone?: "teal" | "primary" | "warning"; className?: string }) {
  const color = tone === "primary" ? "bg-primary" : tone === "warning" ? "bg-warning-soft" : "bg-teal";
  return (
    <div className={cn("h-2 rounded-full bg-line overflow-hidden", className)}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------- Donut */
export function Donut({
  value,
  size = 56,
  stroke = 6,
  color = "#0F8C7F",
  track = "#EBE9E3",
  showLabel = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  showLabel?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[12px] font-semibold text-ink">{Math.round(value)}%</span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Toggle */
export function Toggle({ checked, onChange }: { checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-line-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left] duration-200",
          checked ? "left-[23px]" : "left-[3px]"
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------- Checkbox */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
        onClick={() => onChange?.(!checked)}
        className={cn(
          "h-[18px] w-[18px] rounded-[5px] border grid place-items-center transition",
          checked ? "bg-primary border-primary" : "bg-surface border-line-strong"
        )}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[13.5px] text-ink-soft">{label}</span>
    </label>
  );
}
