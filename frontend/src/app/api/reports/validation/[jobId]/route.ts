import { NextRequest } from "next/server";
import { buildValidation } from "@/lib/mock-data";
import { validationReportPdf } from "@/lib/reports";
import { pdfResponse } from "@/lib/pdf-response";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const bytes = validationReportPdf(buildValidation(params.jobId));
  return pdfResponse(bytes, `validation-report-${params.jobId}.pdf`);
}
