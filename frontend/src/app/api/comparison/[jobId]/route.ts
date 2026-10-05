import { NextRequest, NextResponse } from "next/server";
import { buildComparison } from "@/lib/mock-data";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  return NextResponse.json(buildComparison(params.jobId));
}
