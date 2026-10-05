import { NextRequest } from "next/server";
import { buildComparison } from "@/lib/mock-data";
import { comparisonSnapshotPdf } from "@/lib/reports";
import { pdfResponse } from "@/lib/pdf-response";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const bytes = comparisonSnapshotPdf(buildComparison(params.jobId));
  return pdfResponse(bytes, `comparison-snapshot-${params.jobId}.pdf`);
}
