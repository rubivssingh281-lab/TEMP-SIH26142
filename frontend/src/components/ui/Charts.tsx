"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import type { KpiTrendPoint, CorrelationPoint, MetricTrendRow } from "@/lib/types";

/* --------------------------------------------------- Pure-SVG sparkline */
export function Sparkline({
  data,
  color = "#0F8C7F",
  width = 120,
  height = 34,
  strokeWidth = 1.8,
  fill = false,
}: {
  data: KpiTrendPoint[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
}) {
  if (!data.length) return null;
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - ((d.v - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = `sg-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------ Area sparkline (system) */
export function MiniArea({ data, color = "#0F8C7F" }: { data: KpiTrendPoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------- GPU cluster utilization line */
export function UtilizationChart({ data }: { data: KpiTrendPoint[] }) {
  const withLabels = data.map((d, i) => ({ ...d, label: `${String(i).padStart(2, "0")}:00` }));
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={withLabels} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke="#EFEDE8" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#A6A196" }} tickLine={false} axisLine={false} interval={5} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#A6A196" }} tickLine={false} axisLine={false} ticks={[0, 25, 50, 75, 100]} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EBE9E3" }}
          formatter={(v) => [`${v}%`, "Utilization"]}
        />
        <Line type="monotone" dataKey="v" stroke="#0F8C7F" strokeWidth={2.2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------ Metric trends (validation) */
const TREND_SERIES = [
  { key: "psnr", name: "PSNR (dB)", color: "#D6532B" },
  { key: "ssim", name: "SSIM", color: "#0F8C7F" },
  { key: "sam", name: "SAM (°)", color: "#7A3EA6" },
  { key: "ergas", name: "ERGAS", color: "#E0A020" },
  { key: "lpips", name: "LPIPS", color: "#2F6FB0" },
] as const;

export function MetricTrendChart({ data }: { data: MetricTrendRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
        <CartesianGrid vertical={false} stroke="#EFEDE8" />
        <XAxis dataKey="run" tick={{ fontSize: 9.5, fill: "#A6A196" }} tickLine={false} axisLine={{ stroke: "#EBE9E3" }} angle={0} />
        <YAxis tick={{ fontSize: 10, fill: "#A6A196" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EBE9E3" }} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} verticalAlign="top" height={30} />
        {TREND_SERIES.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2.5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* --------------------------------- Uncertainty vs accuracy scatter */
export function CorrelationScatter({ points }: { points: CorrelationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: -6 }}>
        <CartesianGrid stroke="#EFEDE8" />
        <XAxis
          type="number"
          dataKey="uncertainty"
          domain={[0, 1]}
          tick={{ fontSize: 10, fill: "#A6A196" }}
          tickLine={false}
          axisLine={{ stroke: "#EBE9E3" }}
          label={{ value: "Model Uncertainty (Normalized)", position: "insideBottom", offset: -8, fontSize: 11, fill: "#8A857B" }}
        />
        <YAxis
          type="number"
          dataKey="error"
          scale="log"
          domain={[0.01, 10]}
          ticks={[0.01, 0.1, 1, 10]}
          tick={{ fontSize: 10, fill: "#A6A196" }}
          tickLine={false}
          axisLine={false}
          label={{ value: "Actual Error (RMSE)", angle: -90, position: "insideLeft", offset: 18, fontSize: 11, fill: "#8A857B" }}
        />
        <ReferenceLine
          segment={[
            { x: 0, y: 3 },
            { x: 1, y: 0.05 },
          ]}
          stroke="#D6532B"
          strokeDasharray="5 4"
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EBE9E3" }} />
        <Scatter data={points} fill="#0F8C7F" fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
