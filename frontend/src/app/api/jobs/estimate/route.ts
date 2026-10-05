import { NextRequest, NextResponse } from "next/server";
import type { NewJobEstimate } from "@/lib/types";

// Estimate processing time/storage for an AOI + config (mock heuristic).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const area = Number(body?.area_km2 ?? 12.64);
  const perKm = 11; // ~ minutes per km² baseline
  const minutes = Math.max(20, Math.round(area * perKm));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const est: NewJobEstimate = {
    area_km2: Number(area.toFixed(2)),
    estimated_time: `${h}h ${String(m).padStart(2, "0")}m`,
    estimated_storage_gb: Number((area * 3.85).toFixed(1)),
  };
  return NextResponse.json(est);
}
