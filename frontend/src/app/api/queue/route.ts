import { NextRequest, NextResponse } from "next/server";
import { CLUSTER, QUEUE_JOBS, QUEUE_STATS } from "@/lib/mock-data";
import type { QueueResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const project = sp.get("project");
  const q = (sp.get("q") ?? "").toLowerCase();
  const page = Number(sp.get("page") ?? "1");
  const rows = Number(sp.get("rows") ?? "10");

  let jobs = QUEUE_JOBS;
  if (status && status !== "all") jobs = jobs.filter((j) => j.status === status);
  if (project && project !== "all") jobs = jobs.filter((j) => j.project === project);
  if (q) jobs = jobs.filter((j) => j.job_id.toLowerCase().includes(q) || j.project.toLowerCase().includes(q));

  const body: QueueResponse = {
    stats: QUEUE_STATS,
    jobs,
    cluster: CLUSTER,
    total: 16,
    page,
    rows_per_page: rows,
  };
  return NextResponse.json(body);
}
