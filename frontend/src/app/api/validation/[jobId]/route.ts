import { NextRequest, NextResponse } from "next/server";
import { buildValidation } from "@/lib/mock-data";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  return NextResponse.json(buildValidation(params.jobId));
}
