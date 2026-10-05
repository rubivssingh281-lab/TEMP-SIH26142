import { NextRequest } from "next/server";
import { QUEUE_JOBS } from "@/lib/mock-data";
import { jobManifestPdf } from "@/lib/reports";
import { pdfResponse } from "@/lib/pdf-response";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const job = QUEUE_JOBS.find((j) => j.job_id === params.jobId) ?? QUEUE_JOBS[0];
  const bytes = jobManifestPdf({ ...job, job_id: params.jobId });
  return pdfResponse(bytes, `job-manifest-${params.jobId}.pdf`);
}
