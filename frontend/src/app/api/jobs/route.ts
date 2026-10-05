import { NextRequest, NextResponse } from "next/server";

// Submit a new enhancement job (mock).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 8999);
  return NextResponse.json({
    job_id: `SR_v2_${stamp}_${rand}`,
    status: "queued",
    submitted: body?.job_name ?? "SR_v2_job",
  });
}
