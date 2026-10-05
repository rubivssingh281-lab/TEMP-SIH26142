"use client";

import { useState } from "react";
import { Plus, Minus, Locate, Layers } from "lucide-react";
import { SatelliteTile } from "./SatelliteTile";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * A satellite map viewport with working zoom controls, a layers toggle, scale
 * bar and coordinate readout. `overlay` renders custom SVG/HTML (AOI polygons,
 * markers) on top of the base and zooms with it so annotations stay registered.
 */
export function MapCanvas({
  seed,
  className,
  scale = "10 km",
  coordinate,
  controls = true,
  toolbar,
  legend,
  overlay,
  rounded = true,
}: {
  seed: string;
  className?: string;
  scale?: string;
  coordinate?: string;
  controls?: boolean;
  toolbar?: React.ReactNode;
  legend?: React.ReactNode;
  overlay?: React.ReactNode;
  rounded?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  const zoomBy = (d: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + d) * 2) / 2)));

  return (
    <div className={cn("relative overflow-hidden bg-[#3a3a2c]", rounded && "rounded-xl", className)}>
      {/* Scaled map layer (base + overlay + optional grid) */}
      <div
        className="absolute inset-0 origin-center transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <SatelliteTile seed={seed} variant="sr" className="absolute inset-0 h-full w-full" />
        {overlay}
        {showGrid && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id={`mapgrid-${seed.replace(/\W/g, "")}`} width="10%" height="10%" patternUnits="userSpaceOnUse">
                <path d="M100 0 H0 V100" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#mapgrid-${seed.replace(/\W/g, "")})`} />
          </svg>
        )}
      </div>

      {/* Top-left: drawing toolbar and/or legend (stacked, never overlapping) */}
      {(toolbar || legend) && (
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {toolbar}
          {legend}
        </div>
      )}

      {/* Top-right: zoom + layers controls */}
      {controls && (
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <MapBtn onClick={() => zoomBy(0.5)} disabled={zoom >= MAX_ZOOM} title="Zoom in"><Plus size={16} /></MapBtn>
          <MapBtn onClick={() => zoomBy(-0.5)} disabled={zoom <= MIN_ZOOM} title="Zoom out"><Minus size={16} /></MapBtn>
          <MapBtn onClick={() => { setZoom(1); }} title="Reset view"><Locate size={16} /></MapBtn>
          <MapBtn active={showGrid} onClick={() => setShowGrid((g) => !g)} title="Toggle grid overlay"><Layers size={16} /></MapBtn>
        </div>
      )}

      {/* Zoom readout (only when zoomed) */}
      {zoom > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-3">
          <span className="rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white/90">{zoom.toFixed(1)}×</span>
        </div>
      )}

      {/* Bottom-left: scale bar */}
      <div className="absolute left-3 bottom-3 flex items-center gap-1.5">
        <span className="rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white/90">{scale}</span>
      </div>

      {/* Bottom-right: coordinate readout */}
      {coordinate && (
        <div className="absolute right-3 bottom-3">
          <span className="rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white/90">{coordinate}</span>
        </div>
      )}
    </div>
  );
}

export function MapBtn({
  children,
  active,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 grid place-items-center rounded-md bg-white/95 shadow-sm text-ink-soft hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed",
        active && "bg-primary text-white hover:bg-primary"
      )}
    >
      {children}
    </button>
  );
}
